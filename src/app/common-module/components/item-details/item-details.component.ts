import { Component, OnInit, Input, OnDestroy, OnChanges, input, signal, computed, effect } from '@angular/core';
import { Item, ItemState, Reservation, TotalReportState } from '../../_models';
import { ApiService } from '../../_services';
import { toIsoDate } from '../../_helpers';
import { BehaviorSubject, combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import { switchMap, shareReplay, takeUntil, debounceTime, tap, map, take } from 'rxjs/operators';
import { NbDialogRef } from '@nebular/theme';

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
    standalone: false,
})
export class ItemDetailsComponent implements OnInit, OnDestroy, OnChanges {
    // Inputs
    reservationStart = input<string>(toIsoDate(new Date()));
    reservationEnd = input<string>(
        toIsoDate(new Date(Date.now() + 60 * 60 * 24 * 1000))
    );
    dialog = input.required<NbDialogRef<any>>();
    item = input.required<Item>();

    // Internal Signals
    page = signal(1);
    
    // Output Signals
    reservations = signal<Reservation[]>([]);
    itemHistoryWithState = signal<ItemStateWithArray[]>([]);

    constructor(private api: ApiService) {
        effect(() => {
            const item = this.item();
            const start = this.reservationStart();
            const end = this.reservationEnd();

            this.api.getItemHistory(item.id, {
                start: start + 'T00:00:00',
                end: end + 'T23:59:59',
                limit: 10,
                limitBeforeStart: 10,
                limitAfterEnd: 0,
            }).subscribe(history => {
                const transformed = history.map(entry => ({
                    changesArray: Object.entries(entry.changes)
                        .filter(([_, value]) => value != null)
                        .map(([key, value]) => ({ key, value: value.next })),
                    ...entry,
                }));

                this.itemHistoryWithState.set(transformed);
            });
        });
        
        /*this.itemHistoryWithState$ = combineLatest([this.item$, this.reservationStart$, this.reservationEnd$]).pipe(
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
        );*/

        effect(() => {
            const page = this.page();
            const item = this.item();
            this.api.getReservationHistory(item.id, page)
                .subscribe(new_page => 
                    this.reservations.update(old_data => [...old_data, ...new_page])
                );
        })

        /*this.reservations$ = combineLatest([this.item$]).pipe(
            debounceTime(200),
            switchMap(([item]) => {
                if (item) {
                    return this.api.getReservationHistory(item.id)
                } else {
                    return EMPTY;
                }
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );*/
    }

    ngOnInit() {}

    ngOnDestroy(): void {}

    ngOnChanges(): void {}

    getPicturePreviewUrl(pictureId: string): string {
        return this.api.getPicturePreviewUrl(pictureId);
    }

    stateFields(state: ItemState): FieldItem[] {
        return Object.entries(state.changes).map(([key, value]) => ({ key, value }));
    }

    loadNextPage(): void {
        this.page.update(page => page + 1);
    }
}
