import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    NbDialogService,
    NbSortDirection,
    NbSortRequest,
    NbTreeGridDataSource,
    NbTreeGridDataSourceBuilder,
} from '@nebular/theme';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { delay, map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { fromIsoDate } from "../../../common-module/_helpers";
import { Choice } from '../../../common-module/components/form-element/form-element.component';
import { Item, ItemCondition } from '../../../common-module/_models';
import { ApiService, ItemsService, UpdateService } from '../../../common-module/_services';

interface ItemWithOriginalOrder extends Item {
    originalOrder?: number;
}

interface ItemEntry {
    data: ItemWithOriginalOrder;

    children?: ItemEntry[];

    expanded?: boolean;
}


@Component({
    selector: 'depot-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ItemsComponent implements OnInit, OnDestroy {
    loading = true;
    items$: Observable<ItemWithOriginalOrder[]>;

    allColumns = [
        'externalId',
        'tags',
        'picture',
        'name',
        'description',
        'conditionText',
        'inUseSince',
        'lastService',
        'actions',
    ];

    dataSource: NbTreeGridDataSource<ItemEntry> = null;
    sorting: NbSortRequest = { column: 'originalOrder', direction: NbSortDirection.ASCENDING };

    filter: string;

    showUnavailable$ = new Subject<boolean>();

    private destroyed$ = new Subject<void>();

    constructor(
        public api: ApiService,
        public itemsService: ItemsService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private dataSourceBuilder: NbTreeGridDataSourceBuilder<ItemEntry>,
        private changeDetector: ChangeDetectorRef,
        private dialogService: NbDialogService,
        private updateService: UpdateService
    ) {
    }

    ngOnInit() {
        this.updateService.updateItems$.pipe(takeUntil(this.destroyed$)).subscribe(() => (this.loading = true));
        this.items$ = this.showUnavailable$.pipe(
            startWith(false),
            tap(() => (this.loading = true)),
            delay(1),
            switchMap((showUnavailable) =>
                showUnavailable
                    ? this.itemsService.goneItems$
                    : this.itemsService.items$
            ),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        const itemEntries$ = this.items$.pipe(
            tap(() => (this.loading = true)),
            map((items) => {
                const itemEntries: ItemEntry[] = [];
                const itemsByGroupId: { [id: string]: ItemEntry } = Object.create(null);
                items.forEach((item, idx) => {
                    if (item.groupId) {
                        if (Object.hasOwnProperty.call(itemsByGroupId, item.groupId)) {
                            itemsByGroupId[item.groupId].children.push({ data: { ...item, originalOrder: idx } });
                        } else {
                            const itemEntry = {
                                data: { ...item, originalOrder: idx },
                                children: [
                                    {
                                        data: item,
                                    },
                                ],
                                expanded: false,
                            };
                            itemsByGroupId[item.groupId] = itemEntry;
                            itemEntries.push(itemEntry);
                        }
                    } else {
                        itemEntries.push({ data: { ...item, originalOrder: idx } });
                    }
                });
                return itemEntries;
            }),
            delay(1),
            tap(() => (this.loading = false)),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );
        itemEntries$.subscribe((entries) => {
            this.dataSource = this.dataSourceBuilder.create(entries);
            this.dataSource.filter(this.filter);
            this.dataSource.sort(this.sorting);
            this.changeDetector.markForCheck();
        });
    }

    updateSort(sortRequest: NbSortRequest): void {
        this.sorting = sortRequest;
        console.log('Sort:', sortRequest);
        if (sortRequest.direction === NbSortDirection.NONE) {
            this.sorting = { column: 'originalOrder', direction: NbSortDirection.ASCENDING };
            this.dataSource.sort({ column: 'originalOrder', direction: NbSortDirection.ASCENDING });
        }
        this.changeDetector.markForCheck();
    }

    getSortDirection(column: string): NbSortDirection {
        if (this.sorting.column === column) {
            return this.sorting.direction;
        }
        return NbSortDirection.NONE;
    }

    ngOnDestroy() {
        this.destroyed$.next();
    }

    onCreate() {
        this.router.navigate(['new'], { relativeTo: this.activatedRoute });
    }

    getItemPicturePreviewUrl(item: Item): string {
        return this.api.getPicturePreviewUrl(item.pictureId);
    }

    onClickItem($event: MouseEvent, item: Item) {
        $event.stopPropagation();
        $event.preventDefault();
        this.router.navigate([item.id], { relativeTo: this.activatedRoute.parent });
    }

    openDialog($event: MouseEvent, imageDialog: TemplateRef<any>, item: Item) {
        $event.preventDefault();
        $event.stopPropagation();
        this.dialogService.open(imageDialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            context: item,
            hasScroll: false,
            autoFocus: true,
        });
    }

    reload() {
        this.itemsService.reload();
    }

    onShowUnavailable(showUnavailable: boolean) {
        this.showUnavailable$.next(showUnavailable);
    }
}
