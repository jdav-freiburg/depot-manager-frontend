import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { multicast, refCount, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Reservation } from '../_models';
import { ApiService } from './api.service';
import { UpdateService } from './update.service';

@Injectable({
    providedIn: 'root',
})
export class ReservationsService {
    private reservationsById: Record<string, Reservation> = Object.create(null);
    private readonly fetchingReservationsById: Record<string, Observable<Reservation>> = Object.create(null);
    public readonly reservations$: Observable<Reservation[]>;

    constructor(private api: ApiService, private updateService: UpdateService) {
        this.reservations$ = updateService.updateReservations$.pipe(
            tap(() => (this.reservationsById = Object.create(null))),
            switchMap(() => api.getReservations({})),
            multicast(() => new ReplaySubject<Reservation[]>(1)),
            refCount()
        );
        this.reservations$.subscribe((reservations) => {
            for (const reservation of reservations) {
                this.reservationsById[reservation.id] = reservation;
            }
        });
    }

    getReservationById(reservationId: string): Promise<Reservation> {
        if (
            Object.hasOwnProperty.call(this.reservationsById, reservationId) &&
            this.reservationsById[reservationId].items != null
        ) {
            return Promise.resolve(this.reservationsById[reservationId]);
        }
        if (Object.hasOwnProperty.call(this.fetchingReservationsById, reservationId)) {
            return this.fetchingReservationsById[reservationId].toPromise();
        }
        return (this.fetchingReservationsById[reservationId] = this.api.getReservation(reservationId).pipe(
            tap((reservation) => (this.reservationsById[reservation.id] = reservation)),
            shareReplay(1)
        )).toPromise();
    }

    reload() {
        this.updateService.updateReservations$.next();
    }
}
