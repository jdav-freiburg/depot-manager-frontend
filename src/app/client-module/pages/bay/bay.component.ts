import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, AuthService, ItemsService } from '../../../common-module/_services';
import { BehaviorSubject, Observable, of, Subject, combineLatest } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Bay } from '../../../common-module/_models';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { parseHttpError } from 'src/app/common-module/_helpers';

@Component({
    selector: 'depot-bay',
    templateUrl: './bay.component.html',
    styleUrls: ['./bay.component.scss'],
    standalone: false
})
export class BayComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();

    loading: boolean;
    submitted: boolean;

    isNew: boolean;

    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    bayId: string = null;

    readonly form: UntypedFormGroup = new UntypedFormGroup({
        externalId: new UntypedFormControl(''),
        name: new UntypedFormControl('', Validators.required),
        description: new UntypedFormControl('', Validators.required),
    });

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private toastrService: NbToastrService,
        private itemsService: ItemsService
    ) {}

    ngOnInit() {
        const bayId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('bayId')));
        const loadedBay$ = this.reload$.pipe(
            switchMap(() => bayId$),
            switchMap((bayId) => {
                if (bayId && bayId !== 'new') {
                    return this.api.getBay(bayId);
                }
                return of(null);
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        combineLatest([loadedBay$, this.authService.isAdmin$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([bay, isAdmin]) => {
                if (bay !== null) {
                    this.bayId = bay.id;
                    this.isNew = false;
                    this.form.reset(bay);
                } else {
                    this.bayId = null;
                    this.isNew = true;
                    this.form.reset({
                        externalId: '',
                        name: '',
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
        let apiCall: Observable<Bay>;
        if (this.isNew) {
            const rawValue = this.form.getRawValue();
            delete rawValue.comment;
            apiCall = this.api.createBay(rawValue);
        } else {
            apiCall = this.api.saveBay(this.bayId, this.form.getRawValue());
        }
        apiCall.subscribe(
            (bay) => {
                console.log('Saved', bay);
                this.form.reset(bay);
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.router.navigate(['..', bay.id], {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute,
                });
                this.toastrService.success('Bay was saved', 'Bay Saved');
                this.itemsService.reload();
            },
            (error) => {
                console.log(error);
                this.toastrService.danger(parseHttpError(error), 'Failed');
            }
        );
    }
}
