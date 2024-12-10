import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, TemplateRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NbDialogService, NbIconLibraries } from '@nebular/theme';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { fromIsoDate } from '../../_helpers';
import { Item, ItemState, Reservation, ReservationItem, ReservationState } from '../../_models';
import { Filterable } from '../../_pipes';
import { ApiService } from '../../_services';

interface ItemWithAvailability extends Item, Filterable {
    available: boolean;
}

interface ReservationItemWithPosition {
    item: ItemWithAvailability;
    itemPosition: number;
}

interface ReservationWithItemWithPosition extends Reservation {
    itemsWithPosition: ReservationItemWithPosition[];
    dateStartPosition: number;
    dateWidth: number;
    color: string;
    isCurrent: boolean;
}

interface ItemStateDisplay {
    timestampPosition: number;
    tooltip: string;
    colorId: string;
    color: string;
    itemStates: ItemState[];
}

interface ItemStates {
    item: ItemWithAvailability;
    index: number;
    itemPosition: number;
    states: ItemStateDisplay[];
}

function dateDaysDiff(d1: Date, d2: Date): number {
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
}

@Component({
    selector: 'depot-reservation-items-table',
    templateUrl: './reservation-items-table.component.html',
    styleUrls: ['./reservation-items-table.component.scss'],
    standalone: false
})
export class ReservationItemsTableComponent implements OnChanges, OnDestroy, OnInit {
    @Input() selectedLookup: Record<string, any>;

    private readonly reservationId$ = new BehaviorSubject<string>(null);
    private readonly items$ = new BehaviorSubject<ItemWithAvailability[]>(null);
    private readonly rangeStart$ = new BehaviorSubject<string | Date>(null);
    private readonly rangeEnd$ = new BehaviorSubject<string | Date>(null);
    private readonly selectedItems$$ = new BehaviorSubject<Observable<ReservationItem[]>>(null);
    private readonly showItemHistory$ = new BehaviorSubject<boolean>(null);


    @Input()
    public set items(items: ItemWithAvailability[]) {
        this.items$.next(items);
    }

    public get items(): ItemWithAvailability[] {
        return this.items$.value;
    }

    @Input()
    public set reservationId(reservationId: string) {
        this.reservationId$.next(reservationId);
    }

    public get reservationId(): string {
        return this.reservationId$.value;
    }

    @Input()
    public set rangeStart(rangeStart: string | Date) {
        this.rangeStart$.next(rangeStart);
    }

    public get rangeStart(): string | Date {
        return this.rangeStart$.value;
    }

    @Input()
    public set rangeEnd(rangeEnd: string | Date) {
        this.rangeEnd$.next(rangeEnd);
    }

    public get rangeEnd(): string | Date {
        return this.rangeEnd$.value;
    }

    @Input()
    public set selectedItems$(selectedItems$: Observable<ReservationItem[]>) {
        this.selectedItems$$.next(selectedItems$);
    }

    public get selectedItems$(): Observable<ReservationItem[]> {
        return this.selectedItems$$.value;
    }

    @Input()
    public set showItemHistory(showItemHistory: boolean) {
        this.showItemHistory$.next(showItemHistory);
    }

    public get showItemHistory(): boolean {
        return this.showItemHistory$.value;
    }

    @Output() selectItem = new EventEmitter<string>();
    @Output() deselectItem = new EventEmitter<string>();

    @Output() showDetails = new EventEmitter<ItemWithAvailability>();
    @Output() showReservationDetails = new EventEmitter<ReservationWithItemWithPosition>();

    readonly nameWidth = 200;
    readonly dateWidth = 30;

    readonly dateHeight = 30;
    readonly itemRowHeight = 30;

    readonly preDate = 5;
    readonly postDate = 5;

    readonly colorPalette: string[] = ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'];
    readonly colorPalette2: string[] = [
        '#87a3c4',
        '#024ba6',
        '#b4cff0',
        '#2871c9',
        '#7891b0',
        '#5d90cf',
        '#0a4ea1',
        '#3987e6',
        '#5580b5',
        '#6b819c',
    ];

    dateRange$: Observable<[Date, Date]> = combineLatest([this.rangeStart$, this.rangeEnd$]).pipe(
        distinctUntilChanged(([start1, end1], [start2, end2]) => start1 === start2 && end1 === end2),
        debounceTime(1),
        map(([startStr, endStr]) => {
            if (startStr == null || endStr == null) {
                return [null, null] as [Date, Date];
            }
            let start: Date;
            let end: Date;
            if (startStr instanceof Date) {
                start = startStr;
            } else {
                start = fromIsoDate(startStr);
            }
            if (endStr instanceof Date) {
                end = endStr;
            } else {
                end = fromIsoDate(endStr);
            }
            return [start, end] as [Date, Date];
        }),
        shareReplay(1)
    );

    dateRangeFull$ = this.dateRange$.pipe(
        map(([start, end]) => {
            if (start == null || end == null) {
                return [start, end] as [Date, Date];
            }
            start = new Date(start);
            end = new Date(end);

            start.setDate(start.getDate() - this.preDate);
            end.setDate(end.getDate() + this.postDate);

            return [start, end] as [Date, Date];
        }),
        shareReplay(1)
    );

    dates$ = this.dateRangeFull$.pipe(
        map(([start, end]) => {
            if (start == null || end == null) {
                return [];
            }
            const diffDays = dateDaysDiff(start, end) + 1;

            const dates = [];
            start = new Date(start);
            for (let i = 0; i < diffDays; i++) {
                dates.push({ date: new Date(start), isSelected: i >= this.preDate && i < diffDays - this.postDate });
                start.setDate(start.getDate() + 1);
            }
            return dates;
        })
    );

    totalWidth$ = this.dates$.pipe(map((dates) => this.nameWidth + this.dateWidth * (dates?.length ?? 0)));
    totalHeight$ = this.items$.pipe(map((items) => this.dateHeight + this.itemRowHeight * (items?.length ?? 0)));

    reservations$: Observable<ReservationWithItemWithPosition[]>;
    itemsStates$: Observable<ItemStates[]>;

    detailsIconHtml: any;
    warningIconHtml: any;
    dangerIconHtml: any;
    modificationIconHtml: any;
    detailsIconClasses: string;
    warningIconClasses: string;
    dangerIconClasses: string;
    modificationIconClasses: string;

    constructor(
        public api: ApiService,
        private iconLibrary: NbIconLibraries,
        private sanitizer: DomSanitizer,
        private dialogService: NbDialogService
    ) {
        const reservations$ = this.dateRangeFull$.pipe(
            filter(([start, end]) => !!start && !!end),
            switchMap(([start, end]) =>
                combineLatest([
                    api.getReservations({
                        includeInactive: true,
                        start: start.toISOString().substr(0, 10),
                        end: end.toISOString().substr(0, 10),
                        includeItems: true,
                    }),
                    this.reservationId$,
                ])
            ),
            map(([reservations, reservationId]) =>
                reservations.filter((reservation) => reservation.id !== reservationId)
            ),
            map((reservations) => reservations),
            shareReplay(1)
        );

        const currentReservation$: Observable<Reservation | null> = combineLatest([
            this.dateRange$.pipe(filter(([x, y]) => !!x && !!y)),
            this.reservationId$,
            this.selectedItems$$.pipe(
                switchMap((selectedItems$) => (selectedItems$ == null ? of(null) : selectedItems$))
            ),
        ]).pipe(
            map(([[rangeStart, rangeEnd], reservationId, selectedItems]) =>
                selectedItems == null
                    ? null
                    : {
                          id: reservationId,
                          start: rangeStart,
                          end: rangeEnd,
                          state: ReservationState.Reserved,
                          items: selectedItems,
                          contact: null,
                          name: null,
                          teamId: null,
                          type: null,
                          userId: null,
                          returned: false,
                      }
            )
        );

        const itemsById$ = this.items$.pipe(
            filter((items) => !!items),
            map((items) =>
                items.reduce((o, item, index) => {
                    o[item.id] = { item, index };
                    return o;
                }, Object.create(null) as Record<string, { item: ItemWithAvailability; index: number }>)
            ),
            shareReplay(1)
        );

        const rawHistory$ = combineLatest([
            this.showItemHistory$,
            this.dateRangeFull$.pipe(filter(([x, y]) => !!x && !!y)),
        ]).pipe(
            switchMap(([showItemHistory, [rangeStart, rangeEnd]]) =>
                showItemHistory
                    ? this.api.getItemsHistories({ start: rangeStart.toISOString(), end: rangeEnd.toISOString() })
                    : EMPTY
            ),
            shareReplay(1)
        );

        this.itemsStates$ = combineLatest([
            rawHistory$,
            itemsById$,
            this.dateRangeFull$.pipe(filter(([x, y]) => !!x && !!y)),
        ]).pipe(
            tap((history) => console.log('latest', history)),
            map(([itemStates, itemsById, [rangeStart]]) => {
                const stateItemDateMap: Record<
                    string,
                    { states: ItemStateDisplay[]; statesDateMap: Record<string, ItemStateDisplay> }
                > = Object.create(null);
                const stateColors: Record<string, string> = Object.create(null);
                let nextStateColor = 0;
                const resItemsStates: ItemStates[] = [];
                for (const state of itemStates) {
                    let itemEntry = stateItemDateMap[state.itemId];
                    if (itemEntry == null) {
                        const item = itemsById[state.itemId];
                        if (item == null) {
                            continue;
                        }
                        stateItemDateMap[state.itemId] = itemEntry = {
                            states: [],
                            statesDateMap: Object.create(null),
                        };
                        const itemPosition = this.dateHeight + item.index * this.itemRowHeight - 1;
                        resItemsStates.push({
                            ...item,
                            itemPosition,
                            states: itemEntry.states,
                        });
                    }
                    const dateStamp = state.timestamp.substr(0, 10);
                    let dateEntry = itemEntry.statesDateMap[dateStamp];
                    if (dateEntry == null) {
                        const timestamp = fromIsoDate(dateStamp);
                        const timestampPosition =
                            this.nameWidth + dateDaysDiff(rangeStart, timestamp) * this.dateWidth - 1;

                        let color = stateColors[state.id];
                        if (color == null) {
                            stateColors[state.id] = color = this.colorPalette2[nextStateColor++];
                            nextStateColor %= this.colorPalette2.length;
                        }
                        itemEntry.statesDateMap[dateStamp] = dateEntry = {
                            itemStates: [state],
                            tooltip: `${state.userId}: ${state.comment}`,
                            colorId: state.id,
                            color,
                            timestampPosition,
                        };
                        itemEntry.states.push(dateEntry);
                    } else {
                        dateEntry.colorId += state.id;
                        let color = stateColors[dateEntry.colorId];
                        if (color == null) {
                            stateColors[dateEntry.colorId] = color = this.colorPalette2[nextStateColor++];
                            nextStateColor %= this.colorPalette2.length;
                        }

                        dateEntry.itemStates.push(state);
                        dateEntry.tooltip += `, ${state.userId}: ${state.comment}`;
                    }
                }
                return resItemsStates;
            })
        );

        this.reservations$ = combineLatest([
            reservations$,
            itemsById$,
            this.dateRangeFull$.pipe(filter(([x, y]) => !!x && !!y)),
            currentReservation$,
        ]).pipe(
            map(([reservations, itemsById, [rangeStart], currentReservation]) =>
                (currentReservation == null ? reservations : reservations.concat(currentReservation)).map(
                    (reservation, resIdx) => {
                        const start =
                            reservation.start instanceof Date ? reservation.start : fromIsoDate(reservation.start);
                        const end = reservation.end instanceof Date ? reservation.end : fromIsoDate(reservation.end);
                        const dateStartPosition = this.nameWidth + dateDaysDiff(rangeStart, start) * this.dateWidth - 1;
                        const dateEndPosition = this.nameWidth + (dateDaysDiff(rangeStart, end) + 1) * this.dateWidth;
                        const dateWidth = dateEndPosition - dateStartPosition;
                        return {
                            ...reservation,
                            dateStartPosition,
                            dateWidth,
                            color:
                                reservation.id === currentReservation?.id
                                    ? '#00ff00'
                                    : this.colorPalette[resIdx % this.colorPalette.length],
                            isCurrent: reservation.id === currentReservation?.id,
                            itemsWithPosition: reservation.items
                                .map((resItem) => {
                                    const item = itemsById[resItem.itemId];
                                    if (item == null) {
                                        return null;
                                    }
                                    const itemPosition = this.dateHeight + item.index * this.itemRowHeight - 1;
                                    return {
                                        item: item.item,
                                        itemPosition,
                                    };
                                })
                                .filter((x) => x != null),
                        };
                    }
                )
            )
        );
    }

    loadIcon(name: string): [any, string] {
        const icon = this.iconLibrary.getSvgIcon(name);
        const content = icon.icon.getContent();
        return [this.sanitizer.bypassSecurityTrustHtml(content), icon.icon.getClasses().join(' ')];
    }

    ngOnInit(): void {
        [this.detailsIconHtml, this.detailsIconClasses] = this.loadIcon('info-outline');
        [this.warningIconHtml, this.warningIconClasses] = this.loadIcon('alert-circle-outline');
        [this.dangerIconHtml, this.dangerIconClasses] = this.loadIcon('alert-triangle-outline');
        [this.modificationIconHtml, this.modificationIconClasses] = this.loadIcon('edit');
        this.warningIconClasses += ' status-warning';
        this.dangerIconClasses += ' status-danger';
    }

    ngOnDestroy(): void {
        this.reservationId$.complete();
        this.items$.complete();
        this.rangeStart$.complete();
        this.rangeEnd$.complete();
        this.selectedItems$$.complete();
        this.showItemHistory$.complete();
    }

    ngOnChanges(): void {}

    isSelected(id: string): Observable<boolean> {
        return this.selectedLookup ? this.selectedLookup[id] : of(false);
    }

    showStateDialog(dialogRef: TemplateRef<any>, itemData: ItemStates, stateData: ItemStateDisplay) {
        this.dialogService.open(dialogRef, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            context: {
                item: itemData.item,
                date: stateData.itemStates[0].timestamp.substr(0, 10),
                states: stateData.itemStates.map((entry) => ({
                    changesArray: Object.entries(entry.changes)
                        .filter(([key, value]) => value != null)
                        .map(([key, value]) => ({ key, value: value.next })),
                    ...entry,
                })),
            },
            hasScroll: false,
            autoFocus: true,
        });
    }
}
