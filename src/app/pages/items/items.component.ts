import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService, AuthService} from '../../_services';
import {BehaviorSubject, Observable, of, Subscription} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Reservation, ReservationType} from "../../_models";
import {ActivatedRoute} from "@angular/router";
import {NbToastrService} from "@nebular/theme";
import {shareLast} from "../../_helpers";
import {map, switchMap} from "rxjs/operators";


interface EditReservation {
    id: string;
    type: ReservationType;
    name: string;

    time: {
        start: Date;
        end: Date;
    };
    userId: string;

    teamId: string;

    contact: string;

    items?: string[];
}


@Component({
    selector: 'app-reservation',
    templateUrl: './items.component.html',
})
export class ItemsComponent implements OnInit, OnDestroy {
    loading: boolean;
    submitted: boolean;

    isNew: boolean;

    reload$: BehaviorSubject<any> = new BehaviorSubject(null);

    teams$: Observable<{value: string, title: string}[]>;

    value: EditReservation = null;

    form: FormGroup = new FormGroup({
        name: new FormControl("", Validators.required),
        type: new FormControl("", Validators.required),
        time: new FormControl("", Validators.required),
        user: new FormControl(""),
        team: new FormControl(""),
        contact: new FormControl("", Validators.required),
        items: new FormControl([]),
    });

    private subscriptions: Subscription[] = [];

    constructor(
        public api: ApiService,
        public authService: AuthService,
        public activatedRoute: ActivatedRoute,
        private toastrService: NbToastrService,
    ) {
        // TODO: Get initial reservation and assign to value.
        //   Update form values by loaded reservation
    }

    ngOnInit() {
        const reservationId$ = this.activatedRoute.paramMap.pipe(map(params => params.get('reservationId')));
        const loadedReservation$ = shareLast(this.reload$.pipe(
            switchMap(() => reservationId$),
            switchMap(reservationId => {
                if (reservationId) {
                    return this.api.getReservation(reservationId);
                }
                return of(null);
            })
        ));

        this.teams$ = this.authService.user$.pipe(map(user => user.teams.map(team => { return {value: team, title: team}; })));

        this.subscriptions.push(loadedReservation$.subscribe((reservation) => {
            if (reservation !== null) {
                this.value = {
                    id: reservation.id,
                    type: reservation.type,
                    name: reservation.name,
                    userId: reservation.userId,
                    teamId: reservation.teamId,
                    contact: reservation.contact,
                    time: {
                        start: new Date(reservation.start),
                        end: new Date(reservation.end),
                    },
                };
                this.isNew = false;
                this.form.reset(this.value);
            } else {
                this.isNew = true;
                this.form.reset();
            }
            this.submitted = false;
            this.loading = false;
        }));

        this.subscriptions.push(loadedReservation$.pipe(
            switchMap(reservation => reservation?this.api.getUser(reservation.userId):this.authService.user$),
            map(user => user.name)
        ).subscribe(username => {
            this.form.get('user').reset(username)
        }));

        this.subscriptions.push(loadedReservation$.pipe(
            switchMap(reservation => reservation?of(null):this.authService.user$),
        ).subscribe(user => {
            if (user !== null) {
                this.form.get('contact').reset(`${user.name} (${user.mail}, ${user.mobile})`)
            }
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.subscriptions = []
    }

    onSubmit() {
        console.log("Submit:", this.form.value);
        if (!this.form.valid) {
            return;
        }
        // TODO: Decide if form is new --> create
        // TODO: Otherwise --> differential update
    }
}
