import { Component, forwardRef, Input, OnDestroy, OnInit, TemplateRef, OnChanges } from '@angular/core';
import { ApiService, ItemsService } from '../../_services';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Item, ReservationItem, ReservationState } from '../../_models';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { map, shareReplay, switchMap, takeUntil, tap, skip, debounceTime, delay, catchError } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { Filterable } from '../../_pipes';

interface ItemWithAvailability extends Item, Filterable {
    available: boolean;
}

@Component({
    selector: 'depot-reservation-items',
    templateUrl: './reservation-items.component.html',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReservationItemsComponent), multi: true }],
    styleUrls: ['./reservation-items.component.scss'],
    standalone: false
})
export class ReservationItemsComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
    private readonly reservationsEnd$ = new BehaviorSubject<string>(null);
    private readonly reservationsStart$ = new BehaviorSubject<string>(null);
    private readonly skipReservationId$ = new BehaviorSubject<string>(null);

    private destroyed$ = new Subject<void>();

    loading = true;
    reload$: BehaviorSubject<any> = new BehaviorSubject(null);
    items$: Observable<ItemWithAvailability[]>;
    itemGroups$: Observable<ItemWithAvailability[][]>;

    selected: ReservationItem[] = [];
    selectedLookup: Record<string, boolean> = Object.create(null);
    selected$ = new BehaviorSubject<ReservationItem[]>(this.selected);
    selectedLookup$ = new BehaviorSubject<Record<string, boolean>>(this.selectedLookup);

    disabled = false;

    imageLoading: boolean;

    @Input()
    public set skipReservationId(skipReservationId: string) {
        this.skipReservationId$.next(skipReservationId);
    }

    public get skipReservationId(): string {
        return this.skipReservationId$.value;
    }

    @Input()
    public set reservationsEnd(reservationsEnd: string) {
        this.reservationsEnd$.next(reservationsEnd);
    }

    public get reservationsEnd(): string {
        return this.reservationsEnd$.value;
    }

    @Input()
    public set reservationsStart(reservationsStart: string) {
        this.reservationsStart$.next(reservationsStart);
    }

    public get reservationsStart(): string {
        return this.reservationsStart$.value;
    }

    group = true;
    onlySelected = false;
    filter: string;
    activeTab: any = { tabTitle: 'List' };

    propagateChange: (val: any) => void = () => {};

    constructor(
        public api: ApiService,
        private itemsService: ItemsService,
        private toastrService: NbToastrService,
        private dialogService: NbDialogService
    ) {}

    async toastRemovedItems(itemIds: string[]) {
        const removedItems = (
            await Promise.all(
                itemIds.map((itemId) =>
                    this.api
                        .getItem(itemId)
                        .pipe(catchError(() => itemId))
                        .toPromise()
                )
            )
        )
            .map((item) => (typeof item === 'string' ? item : `${item.name} (${item.externalId})`))
            .join('\n• ');

        this.toastrService.danger(
            `${itemIds.length} items were removed from your reservation, because they were disabled:\n• ${removedItems}`,
            'Items Removed',
            { destroyByClick: true, duration: null, toastClass: 'pre' }
        );
    }

    ngOnInit() {
        const filteredItemIds$ = this.reload$.pipe(
            switchMap(() => combineLatest([this.reservationsStart$, this.reservationsEnd$, this.skipReservationId$])),
            debounceTime(200),
            tap(() => (this.loading = true)),
            delay(1),
            switchMap(([reservationStart, reservationEnd, skipReservationId]) => {
                if (reservationStart && reservationEnd) {
                    return this.api.getReservationItems(reservationStart, reservationEnd, skipReservationId);
                }
                return of([]);
            }),
            map((filteredItemIds) => {
                const mapping: { [id: string]: boolean } = {};
                filteredItemIds.forEach((itemId) => {
                    mapping[itemId] = true;
                });
                return mapping;
            }),
            tap((x) => console.log('filteredItemIds$', x)),
            shareReplay(1)
        );
        this.reload$
            .pipe(
                skip(1),
                tap(() => (this.loading = true)),
                delay(1),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => this.itemsService.reload());
        this.items$ = combineLatest([filteredItemIds$, this.itemsService.items$]).pipe(
            map(([filteredItemIds, items]) => {
                return items.map((item) => {
                    return {
                        ...item,
                        available: !filteredItemIds[item.id],
                        filterLookup: (
                            item.name +
                            '\0' +
                            item.description +
                            '\0' +
                            item.externalId +
                            '\0' +
                            item.tags.join('\0')
                        ).toLowerCase(),
                    };
                });
            }),
            takeUntil(this.destroyed$)
        );

        this.items$.subscribe((items) => {
            const itemsById: { [id: string]: ItemWithAvailability } = items.reduce((obj, item) => {
                obj[item.id] = item;
                return obj;
            }, Object.create(null));
            const foundItems = this.selected.filter((selected) =>
                Object.hasOwnProperty.call(itemsById, selected.itemId)
            );
            if (foundItems.length !== this.selected.length) {
                this.toastRemovedItems(
                    this.selected
                        .filter(
                            (selected) =>
                                !Object.hasOwnProperty.call(itemsById, selected.itemId) &&
                                selected.state === ReservationState.Reserved
                        )
                        .map((selected) => selected.itemId)
                );
            }
            const availableItems = foundItems.filter((selected) => itemsById[selected.itemId].available);
            if (availableItems.length !== foundItems.length) {
                const removedItems = foundItems
                    .filter((selected) => !itemsById[selected.itemId].available)
                    .map((selected) => itemsById[selected.itemId])
                    .map((item) => `${item.name} (${item.externalId})`)
                    .join('\n• ');
                if (removedItems.length > 0) {
                    this.toastrService.danger(
                        `${
                            foundItems.length - availableItems.length
                        } items were removed from your reservation, because they are not available:\n• ${removedItems}`,
                        'Items Removed',
                        { destroyByClick: true, duration: null, toastClass: 'pre' }
                    );
                }
            }

            if (this.selected.length !== availableItems.length) {
                this.selected = availableItems;
                this.selectedLookup = availableItems.reduce((obj, selected) => {
                    obj[selected.itemId] = true;
                    return obj;
                }, {});
                this.propagateChange(this.selected);
                this.selected$.next(this.selected);
                this.selectedLookup$.next(this.selectedLookup);
            }

            this.loading = false;
        });

        this.itemGroups$ = this.items$.pipe(
            map((items) => {
                const groupsById = Object.create(null);
                const groups = [];
                items.forEach((item) => {
                    if (item.groupId) {
                        if (Object.hasOwnProperty.call(groupsById, item.groupId)) {
                            groupsById[item.groupId].push(item);
                        } else {
                            const grp = [item];
                            groupsById[item.groupId] = grp;
                            groups.push(grp);
                        }
                    } else {
                        const grp = [item];
                        groupsById[item.id] = grp;
                        groups.push(grp);
                    }
                });
                return groups;
            })
        );
    }

    ngOnDestroy(): void {
        this.reservationsEnd$.complete();
        this.reservationsStart$.complete();
        this.skipReservationId$.complete();
        this.destroyed$.next();
    }

    ngOnChanges(): void {}

    select(itemId: string) {
        if (this.disabled) {
            return;
        }
        this.selected.push({ itemId, state: ReservationState.Reserved });
        this.selectedLookup[itemId] = true;
        console.log('select', itemId);
        this.propagateChange(this.selected);
        this.selected$.next(this.selected);
        this.selectedLookup$.next(this.selectedLookup);
    }

    deselect(itemId: string) {
        if (this.disabled) {
            return;
        }
        console.log('deselect', itemId);
        const idx = this.selected.findIndex((selected) => selected.itemId === itemId);
        if (~idx) {
            this.selected.splice(idx, 1);
            delete this.selectedLookup[itemId];
        }
        this.propagateChange(this.selected);
        this.selected$.next(this.selected);
        this.selectedLookup$.next(this.selectedLookup);
    }

    setSelected(id: string, selected: boolean) {
        if (this.disabled) {
            return;
        }
        console.log(id, selected);
        if (selected) {
            this.select(id);
        } else {
            this.deselect(id);
        }
    }

    isSelected(id: string): boolean {
        return this.selectedLookup[id];
    }

    writeValue(value) {
        if (value) {
            if (!(value instanceof Array)) {
                throw Error('Invalid value for reservation items');
            }
            this.selected = value;
            this.selectedLookup = this.selected.reduce((obj, item) => {
                obj[item.itemId] = true;
                return obj;
            }, Object.create(null));
            this.selected$.next(this.selected);
            this.selectedLookup$.next(this.selectedLookup);
            console.log('selected', this.selected);
        } else {
            this.selected = [];
            this.selectedLookup = Object.create(null);
            this.selected$.next(this.selected);
            this.selectedLookup$.next(this.selectedLookup);
        }
    }

    registerOnChange(fn) {
        this.propagateChange = fn;
    }

    registerOnTouched() {}

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    getItemPicturePreviewUrl(item: ItemWithAvailability): string {
        return this.api.getPicturePreviewUrl(item.pictureId);
    }

    getItemPictureUrl(item: ItemWithAvailability): string {
        return this.api.getPictureUrl(item.pictureId);
    }

    openDialog($event: MouseEvent | null, imageDialog: TemplateRef<any>, item: ItemWithAvailability) {
        $event?.preventDefault();
        $event?.stopPropagation();
        this.imageLoading = true;
        this.dialogService.open(imageDialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            context: item,
            hasScroll: false,
            autoFocus: true,
        });
    }

    itemGroupSelectedCount(items: ItemWithAvailability[]): number {
        return items.reduce((val, item) => val + (this.selectedLookup[item.id] ? 1 : 0), 0);
    }

    itemGroupSelectableCount(items: ItemWithAvailability[]): number {
        return items.reduce((val, item) => val + (item.available ? 1 : 0), 0);
    }

    itemGroupCanSelectMore(items: ItemWithAvailability[]): boolean {
        return items.some((item) => item.available && !this.selectedLookup[item.id]);
    }

    addToGroup(items: ItemWithAvailability[], count: number = 1) {
        if (this.disabled) {
            return;
        }
        items.forEach((item) => {
            if (count > 0) {
                if (item.available && !this.selectedLookup[item.id]) {
                    this.select(item.id);
                    count -= 1;
                }
            }
        });
    }

    removeFromGroup(items: ItemWithAvailability[], count: number = 1) {
        if (this.disabled) {
            return;
        }
        items.forEach((item) => {
            if (count > 0) {
                if (this.selectedLookup[item.id]) {
                    this.deselect(item.id);
                    count -= 1;
                }
            }
        });
    }

    setGroupCount(items: ItemWithAvailability[], count: number) {
        if (this.disabled) {
            return;
        }
        const currentCount = this.itemGroupSelectedCount(items);
        if (count > currentCount) {
            this.addToGroup(items, count - currentCount);
        } else if (count < currentCount) {
            this.removeFromGroup(items, currentCount - count);
        }
    }
}
