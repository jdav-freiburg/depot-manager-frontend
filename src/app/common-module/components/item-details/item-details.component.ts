import { Component, OnInit, OnDestroy, OnChanges, input, signal, effect } from '@angular/core';
import { Item, ItemState, Reservation } from '../../_models';
import { ApiService } from '../../_services';
import { toIsoDate } from '../../_helpers';
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
    pageSize = signal(10);
    hasMorePages = signal(true);
    
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

        effect(() => {
            const page = this.page();
            const pageSize = this.pageSize();
            const item = this.item();
            this.api.getReservationHistory(item.id, page, pageSize)
                .subscribe(new_page => {
                    this.hasMorePages.set(new_page.length >= pageSize);
                    this.reservations.update(old_data => [...old_data, ...new_page]);
                });
        })
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
