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
    standalone: false,
})
export class ReservationsComponent implements OnInit, OnDestroy {
    private destroyed$ = new Subject<void>();
    loading = true;
    reservations$ = new ReplaySubject<Reservation[]>(1);
    reservations: Reservation[] = [];

    /**
     * List of reservation IDs that are currently active today.
     * A reservation is considered active if the current date falls between its start and end dates, inclusive.
     * This is used to highlight reservations that are ongoing at the moment. */
    currentReservationIds: string[] = [];

    /** List of reservation IDs that are in the past.
     * This is used to highlight old reservations. */
    pastReservationIds: string[] = [];

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
                const placeholderCount = Math.max(0, limit - this.reservations.length);
                this.placeholders$.next(new Array(placeholderCount));
            }
        });
        this.limit$
            .pipe(
                switchMap((limit) => {
                    if (!end) {
                        const pageSize = Math.max(10, limit - this.reservations.length);
                        return this.api.getReservations({ offset: this.reservations.length, limit: pageSize });
                    }
                    return of([]);
                }),
                map((nextReservations: Reservation[]) => {
                    if (nextReservations.length < 10) {
                        end = true;
                    }
                    this.reservations.push(...nextReservations);
                    this.placeholders$.next([]);

                    // Determine all current or upcoming reservations:
                    // 1. Sort all loaded reservations by start time (ascending).
                    // 2. Filter those whose end time is in the future (i.e., still ongoing or upcoming).
                    // 3. Store their IDs in `currentOrNextReservationIds` for UI reference.
                    const now = new Date();
                    const nowTime = now.getTime();
                    const sortedReservations = [...this.reservations].sort(
                        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
                    );

                    const currentReservations: Reservation[] = [];
                    const pastReservations: Reservation[] = [];

                    sortedReservations.forEach((reservation) => {
                        const start = new Date(reservation.start).getTime();
                        const endDate = new Date(reservation.end);
                        endDate.setHours(23, 59, 59, 999);
                        const end = endDate.getTime();

                        if (start <= nowTime && nowTime <= end) {
                            currentReservations.push(reservation);
                        } else if (end < nowTime) {
                            pastReservations.push(reservation);
                        }
                    });

                    // Only load the reservations ids into the arrays
                    this.currentReservationIds = currentReservations.map((r) => r.id);
                    this.pastReservationIds = pastReservations.map((r) => r.id);

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
