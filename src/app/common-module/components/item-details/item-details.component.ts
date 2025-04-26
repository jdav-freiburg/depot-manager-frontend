import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { Item, ItemState, Reservation, TotalReportState } from '../../_models';
import { ApiService } from '../../_services';
import { toIsoDate } from '../../_helpers';
import { BehaviorSubject, combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import { switchMap, shareReplay, takeUntil, debounceTime, tap, map } from 'rxjs/operators';

interface FieldItem {
    key: string;
    value: any;
}

interface ItemStateWithArray extends ItemState {
    changesArray: FieldItem[];
}

@Component({
    selector: 'depot-item-details',
    templateUrl: './item-details.component.html',
    styleUrls: ['./item-details.component.scss'],
    standalone: false
})
export class ItemDetailsComponent implements OnInit, OnDestroy, OnChanges {
    private readonly item$ = new BehaviorSubject<Item>(null);
    private readonly reservationStart$ = new BehaviorSubject<string>(toIsoDate(new Date()));
    private readonly reservationEnd$ = new BehaviorSubject<string>(toIsoDate(new Date(Date.now() + 60 * 60 * 24 * 1000)));

    @Input()
    public set item(item: Item) {
        this.item$.next(item);
    }

    public get item(): Item {
        return this.item$.value;
    }

    @Input()
    public set reservationStart(reservationStart: string) {
        this.reservationStart$.next(reservationStart);
    }

    public get reservationStart(): string {
        return this.reservationStart$.value;
    }

    @Input()
    public set reservationEnd(reservationEnd: string) {
        this.reservationEnd$.next(reservationEnd);
    }

    public get reservationEnd(): string {
        return this.reservationEnd$.value;
    }

    itemHistoryWithState$: Observable<ItemStateWithArray[]>;
    reservations$: Observable<Reservation[]>;
    destroyed$ = new Subject<void>();

    constructor(private api: ApiService) {
        this.itemHistoryWithState$ = combineLatest([this.item$, this.reservationStart$, this.reservationEnd$]).pipe(
            debounceTime(200),
            switchMap(([item, reservationStart, reservationEnd]) => {
                if (item && reservationStart && reservationEnd) {
                    return this.api.getItemHistory(item.id, {
                        start: reservationStart + 'T00:00:00',
                        end: reservationEnd + 'T23:59:59',
                        limit: 10,
                        limitBeforeStart: 10,
                        limitAfterEnd: 0,
                    });
                }
                return EMPTY;
            }),
            map((history) =>
                history.map((entry) => ({
                    changesArray: Object.entries(entry.changes)
                        .filter(([key, value]) => value != null)
                        .map(([key, value]) => ({ key, value: value.next })),
                    ...entry,
                }))
            ),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        this.reservations$ = combineLatest([this.item$, this.reservationStart$, this.reservationEnd$]).pipe(
            debounceTime(200),
            switchMap(([item, reservationStart, reservationEnd]) => {
                if (item && reservationStart && reservationEnd) {
                    return this.api.getReservations({
                        includeInactive: true,
                        //start: reservationStart,
                        //end: reservationEnd,
                        //limitBeforeStart: 1,
                        //limitAfterEnd: 1,
                        includeItems: true,
                    }).pipe(
                        map(
                            res => res.filter(
                                r => r.items && r.items.map((item, _) => item.itemId).includes(item.id)))
                    ); 
                }
                return EMPTY;
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );
    }

    ngOnInit() {}

    ngOnDestroy(): void {
        this.item$.complete();
        this.reservationStart$.complete();
        this.reservationEnd$.complete();
        this.destroyed$.next();
    }

    ngOnChanges(): void {}

    getPicturePreviewUrl(pictureId: string): string {
        return this.api.getPicturePreviewUrl(pictureId);
    }

    stateFields(state: ItemState): FieldItem[] {
        return Object.entries(state.changes).map(([key, value]) => ({ key, value }));
    }
}
