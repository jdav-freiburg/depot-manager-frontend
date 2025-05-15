import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, AuthService, ReportService } from '../../../common-module/_services';
import { BehaviorSubject, Observable, of, Subject, combineLatest } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ReportElement } from '../../../common-module/_models';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { parseHttpError } from 'src/app/common-module/_helpers';

@Component({
    selector: 'depot-report-element',
    templateUrl: './report-element.component.html',
    styleUrls: ['./report-element.component.scss'],
    standalone: false
})
export class ReportElementComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();

    loading: boolean;
    submitted: boolean;

    isNew: boolean;

    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    reportElementId: string = null;

    readonly form: UntypedFormGroup = new UntypedFormGroup({
        title: new UntypedFormControl('', Validators.required),
        description: new UntypedFormControl('', Validators.required),
    });

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private toastrService: NbToastrService,
        private reportService: ReportService
    ) {}

    ngOnInit() {
        const reportElementId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('reportElementId')));
        const loadedReportElement$ = this.reload$.pipe(
            switchMap(() => reportElementId$),
            switchMap((reportElementId) => {
                if (reportElementId && reportElementId !== 'new') {
                    return this.api.getReportElement(reportElementId);
                }
                return of(null);
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        combineLatest([loadedReportElement$, this.authService.isAdmin$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([reportElement, isAdmin]) => {
                if (reportElement !== null) {
                    this.reportElementId = reportElement.id;
                    this.isNew = false;
                    this.form.reset(reportElement);
                } else {
                    this.reportElementId = null;
                    this.isNew = true;
                    this.form.reset({
                        title: '',
                        description: '',
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
        let apiCall: Observable<ReportElement>;
        if (this.isNew) {
            const rawValue = this.form.getRawValue();
            delete rawValue.comment;
            apiCall = this.api.createReportElement(rawValue);
        } else {
            apiCall = this.api.saveReportElement(this.reportElementId, this.form.getRawValue());
        }
        apiCall.subscribe(
            (reportElement) => {
                console.log('Saved', reportElement);
                this.form.reset(reportElement);
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.router.navigate(['..', reportElement.id], {
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
}
