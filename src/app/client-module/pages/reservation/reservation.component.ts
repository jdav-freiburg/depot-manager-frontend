import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import {
    ApiService,
    AuthService,
    UpdateService,
    User as SelfUser,
    UsersService,
} from '../../../common-module/_services';
import { BehaviorSubject, Observable, of, Subject, combineLatest } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Reservation, ReservationType, User as ApiUser } from '../../../common-module/_models';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { filter, map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/common-module/components/confirm-dialog/confirm-dialog.component';
import { parseHttpError } from 'src/app/common-module/_helpers';

@Component({
    selector: 'depot-reservation',
    standalone: false,
    styles: `
        :host {
            --card-margin-bottom: 0,
        }`,
    templateUrl: './reservation.component.html'
})
export class ReservationComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();

    loading: boolean;
    submitted: boolean;

    #isNew = signal<boolean>(false);
    isNew = this.#isNew.asReadonly();

    reload$: BehaviorSubject<void> = new BehaviorSubject(undefined);

    teams$: Observable<{ value: string; title: string }[]>;

    reservationId: string = null;

    readonly form: UntypedFormGroup = new UntypedFormGroup({
        name: new UntypedFormControl('', Validators.required),
        type: new UntypedFormControl(null, Validators.required),
        start: new UntypedFormControl(null, Validators.required),
        end: new UntypedFormControl(null, Validators.required),
        userId: new UntypedFormControl(null),
        teamId: new UntypedFormControl({ value: null, disabled: true }),
        contact: new UntypedFormControl('', Validators.required),
        items: new UntypedFormControl([]),
    });
    readonly userName = new UntypedFormControl({ value: '', disabled: true });
    userIdRaw$ = new BehaviorSubject<string>(null);
    readonly code = new UntypedFormControl({ value: null, disabled: true });

    reservationChoices = [
        { value: ReservationType.Private, title: 'Private' },
        { value: ReservationType.Team, title: 'Team' },
    ];
    allUsers$: Observable<{ value: string; title: string }[] | undefined>;

    canReturn$: Observable<boolean>;

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        private userService: UsersService,
        public router: Router,
        private toastrService: NbToastrService,
        private dialogService: NbDialogService,
        private updateService: UpdateService
    ) {
    }

    ngOnInit() {
        const reservationId$ = this.activatedRoute.paramMap.pipe(map((params) => params.get('reservationId')));
        const loadedReservation$: Observable<Reservation> = this.reload$.pipe(
            switchMap(() => reservationId$),
            switchMap((reservationId) => {
                if (reservationId && reservationId !== 'new') {
                    return this.api.getReservation(reservationId);
                }
                return of(null);
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        /*this.teams$ = this.authService.user$.pipe(
            map((user) => user.teams?.map((team) => ({ value: team, title: team })) ?? [])
        );*/

        const selectedUser$ = this.authService.user$.pipe(
            switchMap((user) =>
                user.roles.includes('admin')
                    ? this.form.controls.userId.valueChanges.pipe(
                        startWith(this.form.controls.userId.value),
                        switchMap((userId) => this.userService.getUser(userId)),
                        tap((u) => console.log('Fetched selected user:', u))
                    )
                    : of(user)
            ),
            shareReplay(1)
        );
        selectedUser$
            .pipe(
                filter((u) => !!u),
                takeUntil(this.destroyed$)
            )
            .subscribe((user) => {
                const phoneNumber = (user as SelfUser).phone_number || (user as ApiUser).phoneNumber;
                this.form.controls.contact.setValue(`${user.name} (${user.email}, ${phoneNumber})`);
            });

        this.teams$ = selectedUser$.pipe(
            map((user) => user?.teams?.map((team) => ({ value: team, title: team })) ?? [])
        );

        this.allUsers$ = this.authService.user$.pipe(
            switchMap((user) => (user.roles.includes('admin') ? this.userService.allUsers() : of([user]))),
            map((users) => users.map((user) => ({ value: user.sub, title: `${user.name}` })) ?? [])
        );

        combineLatest([loadedReservation$, this.authService.user$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([reservation, user]) => {
                if (reservation !== null) {
                    this.reservationId = reservation.id;
                    this.#isNew.set(false);
                    this.userName.reset(reservation.userId);
                    this.userIdRaw$.next(reservation.userId);
                    this.code.reset(reservation.code);
                    this.form.reset(reservation);

                    if (
                        reservation.userId === user.sub ||
                        user.teams?.includes(reservation.teamId) ||
                        user.roles.includes('admin')
                    ) {
                        this.form.enable();
                    } else {
                        this.form.disable();
                    }
                } else {
                    this.reservationId = null;
                    this.#isNew.set(true);
                    this.userName.reset(user.sub);
                    this.userIdRaw$.next(user.sub);
                    this.code.reset(null);
                    this.form.reset({
                        id: null,
                        type: null,
                        name: '',
                        start: null,
                        end: null,
                        userId: user.sub,

                        teamId: null,
                        contact: `${user.name} (${user.email}, ${user.phone_number})`,

                        items: [],
                    });
                }
                this.onTypeChange(this.form.controls.type.value);
                this.submitted = false;
                this.loading = false;
            });
        this.canReturn$ = this.form.controls.start.valueChanges.pipe(
            startWith(this.form.controls.start.value),
            map((value) => value && value <= new Date().toISOString().substring(0, 10)),
            takeUntil(this.destroyed$)
        );

        this.userIdRaw$
            .pipe(
                switchMap((userId) => (userId ? this.userService.getUser(userId) : of({ name: userId }))),
                takeUntil(this.destroyed$)
            )
            .subscribe((user) => {
                if (user) {
                    this.userName.reset(user.name);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    onTypeChange($event) {
        if ($event === ReservationType.Team) {
            this.form.controls.teamId.enable();
        } else {
            this.form.controls.teamId.setValue(null);
            this.form.controls.teamId.disable();
        }
    }

    onShowDeleteDialog() {
        const dialogRef = this.dialogService.open(ConfirmDialogComponent);
        const name = this.form.controls.name.value;
        dialogRef.componentRef.instance.title = 'Really delete reservation?';
        dialogRef.componentRef.instance.message = `Do you really want to delete the reservation ${name}?`;
        dialogRef.componentRef.instance.confirmStatus = 'danger';
        dialogRef.componentRef.instance.confirmTitle = 'Delete';
        dialogRef.componentRef.instance.cancelTitle = 'Cancel';
        dialogRef.onClose.subscribe((result) => {
            if (result) {
                this.api.deleteReservation(this.reservationId).subscribe(
                    () => {
                        console.log('Deleted', this.reservationId);
                        this.updateService.updateReservations$.next();
                        this.router.navigate(['..'], {
                            replaceUrl: true,
                            relativeTo: this.activatedRoute,
                        });
                        this.toastrService.success(`Reservation ${name} was deleted`, 'Reservation Deleted');
                    },
                    (error) => {
                        console.log(error);
                        this.toastrService.danger(parseHttpError(error), 'Failed');
                    }
                );
            }
        });
    }

    onSubmit() {
        this.submitted = true;
        if (!this.form.valid) {
            return;
        }
        let apiCall: Observable<Reservation>;
        const formValue = this.form.getRawValue();
        if (formValue.userId == null) {
            formValue.userId = this.userIdRaw$.value;
        }
        console.log('Submit:', formValue);
        formValue.items = formValue.items.map((item) => item.itemId);
        if (this.isNew()) {
            apiCall = this.api.createReservation(formValue);
        } else {
            apiCall = this.api.saveReservation(this.reservationId, formValue);
        }
        apiCall.subscribe(
            (reservation) => {
                console.log('Saved', reservation);
                this.form.reset(reservation);
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.updateService.updateReservations$.next();
                this.router.navigate(['..', reservation.id], {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute,
                });
                this.toastrService.success('Reservation was saved', 'Reservation Saved');
            },
            (error) => {
                console.log(error);
                this.toastrService.danger(parseHttpError(error), 'Failed');
            }
        );
    }
}
