import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService, AuthService, ReportService } from '../../../common-module/_services';
import { BehaviorSubject, Observable, of, Subject, combineLatest } from 'rxjs';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ReportProfile } from '../../../common-module/_models';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { parseHttpError } from 'src/app/common-module/_helpers';

@Component({
    selector: 'depot-report-profile',
    templateUrl: './report-profile.component.html',
    styleUrls: ['./report-profile.component.scss'],
    standalone: false
})
export class ReportProfileComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();

    loading: boolean;
    submitted: boolean;

    isNew: boolean;

    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    reportProfileId: string = null;

    readonly elementsForm: UntypedFormArray = new UntypedFormArray([]);
    readonly form: UntypedFormGroup = new UntypedFormGroup({
        name: new UntypedFormControl('', Validators.required),
        description: new UntypedFormControl('', Validators.required),
        elements: this.elementsForm,
    });

    @ViewChild('selectReportElementDialog', { static: true }) selectReportElementDialog!: TemplateRef<any>;

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private toastrService: NbToastrService,
        private reportService: ReportService,
        private dialogService: NbDialogService
    ) {}

    ngOnInit() {
        const reportProfileId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('reportProfileId')));
        const loadedReportProfile$ = this.reload$.pipe(
            switchMap(() => reportProfileId$),
            switchMap((reportProfileId) => {
                if (reportProfileId && reportProfileId !== 'new') {
                    return this.api.getReportProfile(reportProfileId);
                }
                return of(null);
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        combineLatest([loadedReportProfile$, this.authService.isAdmin$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([reportProfile, isAdmin]) => {
                if (reportProfile !== null) {
                    this.reportProfileId = reportProfile.id;
                    this.isNew = false;
                    while (this.elementsForm.controls.length > (reportProfile.elements?.length ?? 0)) {
                        this.elementsForm.removeAt(0);
                    }
                    while (this.elementsForm.controls.length < (reportProfile.elements?.length ?? 0)) {
                        this.elementsForm.push(new UntypedFormControl('', Validators.required));
                    }
                    this.form.reset(reportProfile);
                } else {
                    this.reportProfileId = null;
                    this.isNew = true;
                    while (this.elementsForm.controls.length > 0) {
                        this.elementsForm.removeAt(0);
                    }
                    this.form.reset({
                        title: '',
                        description: '',
                        elements: [],
                    });
                }
                if (isAdmin) {
                    this.form.enable();
                } else {
                    this.form.disable();
                }
                this.submitted = false;
                this.loading = false;
            });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    onSubmit() {
        console.log('Submit:', this.form.getRawValue());
        this.submitted = true;
        if (!this.form.valid) {
            return;
        }
        let apiCall: Observable<ReportProfile>;
        if (this.isNew) {
            const rawValue = this.form.getRawValue();
            delete rawValue.comment;
            apiCall = this.api.createReportProfile(rawValue);
        } else {
            apiCall = this.api.saveReportProfile(this.reportProfileId, this.form.getRawValue());
        }
        apiCall.subscribe(
            (reportProfile) => {
                console.log('Saved', reportProfile);
                this.form.reset(reportProfile);
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.router.navigate(['..', reportProfile.id], {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute,
                });
                this.toastrService.success('Report element was saved', 'Report element Saved');
                this.reportService.reload();
            },
            (error) => {
                console.log(error);
                this.toastrService.danger(parseHttpError(error), 'Failed');
            }
        );
    }

    addReportElement(value?: string) {
        this.elementsForm.push(new UntypedFormControl(value, Validators.required));
    }

    openReportElementDialog($event: MouseEvent, context?: any) {
        $event.preventDefault();
        $event.stopPropagation();
        this.dialogService.open(this.selectReportElementDialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            hasScroll: false,
            autoFocus: true,
            context,
        });
    }

    removeElement(elementForm: UntypedFormGroup) {
        this.elementsForm.controls.splice(this.elementsForm.controls.indexOf(elementForm), 1);
    }

    onDropElement($event: CdkDragDrop<string[]>) {
        console.log('Drop:', $event);
        moveItemInArray(this.elementsForm.controls, $event.previousIndex, $event.currentIndex);
    }
}
