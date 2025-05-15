import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import {
    ApiService,
    AuthService,
    ItemsService,
    ReportProfileWithElements,
    ReportService,
} from '../../../common-module/_services';
import { BehaviorSubject, Observable, of, Subject, combineLatest } from 'rxjs';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
    Item,
    ItemCondition,
    ReportElement,
    ReportItemInWrite,
    TotalReportState,
} from '../../../common-module/_models';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbDialogService, NbDialogRef } from '@nebular/theme';
import { distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { Choice } from '../../../common-module/components/form-element/form-element.component';
import { parseHttpError } from 'src/app/common-module/_helpers';

class ReportElementFormGroup extends UntypedFormGroup {
    constructor(public readonly reportElement: ReportElement) {
        super({
            reportElementId: new UntypedFormControl(reportElement.id),
            state: new UntypedFormControl(null, Validators.required),
            comment: new UntypedFormControl(null),
        });
    }
}

@Component({
    selector: 'depot-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    standalone: false
})
export class ItemComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();

    loading: boolean;
    submitted: boolean;

    isNew: boolean;

    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    itemId: string = null;
    initialGroupId: string = null;

    conditionTranslation: Record<ItemCondition, [string, string]> = {
        good: ['Good', 'success'],
        ok: ['Ok', 'success'],
        bad: ['Bad', 'warning'],
        gone: ['Unavailable', 'danger'],
    };

    conditionChoices: Choice<ItemCondition>[] = [
        ItemCondition.Good,
        ItemCondition.Ok,
        ItemCondition.Bad,
        ItemCondition.Gone,
    ].map((value) => {
        return {
            value,
            title: this.conditionTranslation[value][0],
            status: this.conditionTranslation[value][1],
        };
    });

    createReport = false;

    groupItem = new UntypedFormControl(false);

    reportProfile$: Observable<ReportProfileWithElements>;

    readonly reportForm: UntypedFormArray = new UntypedFormArray([]);
    readonly form: UntypedFormGroup = new UntypedFormGroup({
        externalId: new UntypedFormControl(''),
        manufacturer: new UntypedFormControl(''),
        model: new UntypedFormControl(''),
        serialNumber: new UntypedFormControl(''),
        manufactureDate: new UntypedFormControl(null),
        purchaseDate: new UntypedFormControl(null),
        firstUseDate: new UntypedFormControl(null),
        name: new UntypedFormControl('', Validators.required),
        description: new UntypedFormControl('', Validators.required),
        reportProfileId: new UntypedFormControl(null),
        condition: new UntypedFormControl(null, Validators.required),
        conditionComment: new UntypedFormControl(''),
        pictureId: new UntypedFormControl(null),
        groupId: new UntypedFormControl(null),
        bayId: new UntypedFormControl(null),
        tags: new UntypedFormControl([]),
        changeComment: new UntypedFormControl(''),
    } as Record<keyof ReportItemInWrite, UntypedFormControl | UntypedFormArray>);

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private toastrService: NbToastrService,
        private dialogService: NbDialogService,
        private itemsService: ItemsService,
        private reportService: ReportService
    ) {}

    ngOnInit() {
        const itemId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('itemId')));
        const loadedItem$ = this.reload$.pipe(
            switchMap(() => itemId$),
            switchMap((itemId) => {
                if (itemId && itemId !== 'new') {
                    return this.api.getItem(itemId);
                }
                return of(null);
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        combineLatest([loadedItem$, this.authService.isManager$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([item, isManager]) => {
                if (item !== null) {
                    this.itemId = item.id;
                    this.isNew = false;
                    this.initialGroupId = item.groupId;
                    this.form.reset(item);
                    this.groupItem.reset(!!item.groupId);
                } else {
                    this.itemId = null;
                    this.isNew = true;
                    this.initialGroupId = null;
                    this.reportForm.clear();
                    this.form.reset({
                        externalId: '',

                        manufacturer: '',
                        model: '',
                        serialNumber: '',
                        manufactureDate: null,
                        purchaseDate: null,
                        firstUseDate: null,

                        name: '',
                        description: '',
                        reportProfileId: null,

                        condition: null,
                        conditionComment: '',

                        pictureId: null,

                        groupId: null,

                        bayId: null,

                        tags: [],

                        changeComment: '',

                        lastService: null,
                        totalReportState: null,
                        report: [],
                    } as ReportItemInWrite);
                }
                if (isManager) {
                    this.form.enable();
                } else {
                    this.form.disable();
                }
                this.submitted = false;
                this.loading = false;
            });
        this.reportProfile$ = this.form.controls.reportProfileId.valueChanges.pipe(
            startWith(this.form.controls.reportProfileId.value),
            distinctUntilChanged(),
            switchMap((reportProfileId) =>
                this.reportService.profilesByIdWithElements$.pipe(map((byId) => byId[reportProfileId]))
            ),
            takeUntil(this.destroyed$)
        );

        this.reportProfile$.pipe(takeUntil(this.destroyed$)).subscribe((reportProfile) => {
            this.reportForm.clear();
            if (reportProfile != null) {
                for (const element of reportProfile.elements) {
                    const elementForm = new ReportElementFormGroup(element);
                    this.reportForm.push(elementForm);
                }
            }
        });

        this.itemsService.items$.pipe(takeUntil(this.destroyed$)).subscribe(() => {});
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    initReport() {
        const profileId = this.form.controls.reportProfileId.value;
        if (profileId == null) {
            return;
        }
        this.form.addControl('lastService', new UntypedFormControl(new Date().toISOString().substring(0, 10)));
        this.form.addControl('totalReportState', new UntypedFormControl(null, Validators.required));
        this.form.addControl('report', this.reportForm);
        this.form.updateValueAndValidity();
        this.form.controls.changeComment.setValue('Inspection');
        this.createReport = true;
    }

    uninitReport() {
        this.form.removeControl('lastService');
        this.form.removeControl('totalReportState');
        this.form.removeControl('report');
        this.form.updateValueAndValidity();
        this.form.controls.changeComment.setValue('');
        this.createReport = false;
    }

    openConfirmDialog($event: MouseEvent, dialog: TemplateRef<any>) {
        $event.preventDefault();
        $event.stopPropagation();
        this.submitted = true;
        if (!this.form.valid) {
            return;
        }
        if (this.isNew) {
            this.onSubmit(null);
        } else {
            this.dialogService.open(dialog, {
                hasBackdrop: true,
                closeOnBackdropClick: false,
                hasScroll: false,
                autoFocus: true,
            });
        }
    }

    openItemDialog($event: MouseEvent, dialog: TemplateRef<any>) {
        $event.preventDefault();
        $event.stopPropagation();
        this.dialogService.open(dialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            hasScroll: false,
            autoFocus: true,
            context: {
                id: this.itemId,
                ...this.form.value,
            },
        });
    }

    async openCopyFromItemDialog(newGroupId: string, dialog: TemplateRef<any>) {
        if (newGroupId && newGroupId !== this.initialGroupId) {
            const groupItems = await this.itemsService.itemsByGroupId$
                .pipe(
                    map((itemsByGroupId) => itemsByGroupId[newGroupId]),
                    take(1)
                )
                .toPromise();
            if (groupItems) {
                this.dialogService.open(dialog, {
                    hasBackdrop: true,
                    closeOnBackdropClick: false,
                    hasScroll: false,
                    autoFocus: true,
                    context: groupItems[0],
                });
            }
        }
        this.initialGroupId = newGroupId;
    }

    copyFrom(sourceItem: Item) {
        this.form.patchValue({
            externalId: sourceItem.externalId ? sourceItem.externalId + ' copy' : '',

            manufacturer: sourceItem.manufacturer,
            model: sourceItem.model,
            manufactureDate: sourceItem.manufactureDate,
            purchaseDate: sourceItem.purchaseDate,
            firstUseDate: sourceItem.firstUseDate,

            name: sourceItem.name,
            description: sourceItem.description,
            reportProfileId: sourceItem.reportProfileId,

            pictureId: sourceItem.pictureId,

            bayId: sourceItem.bayId,

            tags: sourceItem.tags,
        });
        this.form.updateValueAndValidity();
    }

    onSubmit(dialogRef: NbDialogRef<any>) {
        console.log('Submit:', this.form.getRawValue());
        this.submitted = true;
        if (!this.form.valid) {
            return;
        }
        let apiCall: Observable<Item>;
        const rawValue = this.form.getRawValue();
        if (!this.createReport) {
            delete rawValue.lastService;
            delete rawValue.totalReportState;
            delete rawValue.report;
        }
        if (this.isNew) {
            delete rawValue.comment;
            if (!this.createReport) {
                rawValue.report = [];
                rawValue.totalReportState = TotalReportState.Fit;
            }
            apiCall = this.api.createItem(rawValue);
        } else if (this.createReport) {
            apiCall = this.api.reportItem(this.itemId, rawValue);
        } else {
            apiCall = this.api.saveItem(this.itemId, rawValue);
        }
        apiCall.subscribe(
            (item) => {
                console.log('Saved', item);
                this.uninitReport();
                this.form.reset(item);
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.router.navigate(['..', item.id], {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute,
                });
                this.toastrService.success('Item was saved', 'Item Saved');
                if (dialogRef) {
                    dialogRef.close();
                }
                this.itemsService.reload();
            },
            (error) => {
                console.log(error);
                this.toastrService.danger(parseHttpError(error), 'Failed');
            }
        );
    }
}
