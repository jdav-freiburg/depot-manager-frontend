import { Component, OnInit, Input, OnDestroy, OnChanges, TemplateRef } from '@angular/core';
import { Item, Reservation } from '../../_models';
import { ItemsService } from '../../_services';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { NbDialogService } from '@nebular/theme';

@Component({
    selector: 'depot-reservation-details',
    templateUrl: './reservation-details.component.html',
    styleUrls: ['./reservation-details.component.scss'],
    standalone: false
})
export class ReservationDetailsComponent implements OnInit, OnDestroy, OnChanges {
    private readonly reservation$ = new BehaviorSubject<Reservation>(null);

    @Input()
    public set reservation(reservation: Reservation) {
        this.reservation$.next(reservation);
    }

    public get reservation(): Reservation {
        return this.reservation$.value;
    }

    destroyed$ = new Subject<void>();
    reservedItems$: Observable<Item[]>;

    constructor(itemsService: ItemsService, private dialogService: NbDialogService) {
        this.reservedItems$ = this.reservation$.pipe(
            switchMap((reservation) =>
                itemsService.itemsById$.pipe(
                    map((itemsById) => reservation.items.map((item) => itemsById[item.itemId]))
                )
            )
        );
    }

    ngOnInit() {}

    ngOnDestroy(): void {
        this.reservation$.complete();
        this.destroyed$.next();
    }

    ngOnChanges(): void {}
}
