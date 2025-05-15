import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, of, ReplaySubject, Subject } from 'rxjs';
import { ApiService, UpdateService } from '../../../common-module/_services';
import { ActivatedRoute, Router } from '@angular/router';
import { Reservation } from '../../../common-module/_models';
import { map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'depot-reservations',
    templateUrl: './reservations.component.html',
    styleUrls: ['./reservations.component.scss'],
    standalone: false
})
export class ReservationsComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();
    loading = true;
    reservations$ = new ReplaySubject<Reservation[]>(1);
    reservations: Reservation[] = [];

    limit$ = new BehaviorSubject<number>(30);
    placeholders$ = new ReplaySubject<void[]>(1);

    constructor(
        public api: ApiService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        public updateService: UpdateService
    ) {}

    ngOnInit() {
        let end = false;

        this.updateService.updateReservations$.subscribe(() => {
            this.loading = true;
            this.reservations = [];
            end = false;
            this.limit$.next(30);
        });
        this.limit$.subscribe((limit) => {
            if (!end) {
                this.placeholders$.next(new Array(limit - this.reservations.length));
            }
        });
        this.limit$
            .pipe(
                switchMap((limit) => {
                    if (!end) {
                        return this.api.getReservations({ offset: this.reservations.length, limit });
                    }
                    return of([]);
                }),
                map((nextReservations) => {
                    if (nextReservations.length < 10) {
                        end = true;
                    }
                    this.reservations.push(...nextReservations);
                    this.placeholders$.next([]);
                    return this.reservations;
                }),
                tap(() => (this.loading = false)),
                shareReplay(1),
                takeUntil(this.destroyed$)
            )
            .subscribe(this.reservations$);
    }

    ngOnDestroy() {
        this.destroyed$.next();
    }

    onCreate() {
        this.router.navigate(['new'], { relativeTo: this.activatedRoute });
    }

    onLoadNext() {
        const nextValue = this.limit$.value + 10;
        if (nextValue <= this.reservations.length + 10) {
            console.log('loadNext:', nextValue);
            this.limit$.next(nextValue);
        }
    }

    onClickReservation(reservation: Reservation) {
        this.router.navigate([reservation.id], { relativeTo: this.activatedRoute });
    }
}
