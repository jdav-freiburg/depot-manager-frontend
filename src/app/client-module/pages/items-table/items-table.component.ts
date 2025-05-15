import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDateService, NbDialogService, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { delay, map, shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Filterable } from 'src/app/common-module/_pipes';
import { Item, ItemCondition } from '../../../common-module/_models';
import { ApiService, ItemsService, UpdateService } from '../../../common-module/_services';

interface ItemWithConditionText extends Item, Filterable {
    conditionText: string;
    originalOrder?: number;
}

@Component({
    selector: 'depot-items-table',
    templateUrl: './items-table.component.html',
    styleUrls: ['./items-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ItemsTableComponent implements OnInit, OnDestroy {
    loading = true;
    items$: Observable<ItemWithConditionText[]>;

    filter: string;

    rangeStart: Date;
    rangeEnd: Date;

    conditionTranslation: Record<ItemCondition, string> = {
        good: 'Good',
        ok: 'Ok',
        bad: 'Bad',
        gone: 'Gone',
    };

    showUnavailable = false;
    showUnavailable$ = new BehaviorSubject<boolean>(false);

    private destroyed$ = new Subject<void>();

    constructor(
        public api: ApiService,
        public itemsService: ItemsService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        public dateService: NbDateService<Date>,
        private dialogService: NbDialogService,
        private updateService: UpdateService
    ) {}

    ngOnInit() {
        this.updateService.updateItems$.pipe(takeUntil(this.destroyed$)).subscribe(() => (this.loading = true));
        this.items$ = this.showUnavailable$.pipe(
            tap(() => (this.loading = true)),
            delay(1),
            switchMap((showUnavailable) =>
                showUnavailable
                    ? this.updateService.updateItems$.pipe(switchMap(() => this.api.getItems(true)))
                    : this.itemsService.items$
            ),
            map((items) =>
                items.map((item) => {
                    return {
                        ...item,
                        conditionText:
                            this.conditionTranslation[item.condition] +
                            (item.conditionComment ? ': ' + item.conditionComment : ''),
                        filterLookup: (
                            item.name +
                            '\0' +
                            item.description +
                            '\0' +
                            item.externalId +
                            '\0' +
                            item.tags.join('\0')
                        ).toLowerCase(),
                        available: true,
                    };
                })
            ),
            tap(() => (this.loading = false)),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );
        this.rangeStart = this.dateService.getMonthStart(this.dateService.today());
        this.rangeEnd = this.dateService.getMonthEnd(this.rangeStart);
    }

    ngOnDestroy() {
        this.destroyed$.next();
    }

    onCreate() {
        this.router.navigate(['new'], { relativeTo: this.activatedRoute });
    }

    onClickItem($event: MouseEvent, itemId: string) {
        $event?.stopPropagation();
        $event?.preventDefault();
        this.router.navigate([itemId], { relativeTo: this.activatedRoute.parent });
    }

    openDialog($event: MouseEvent, imageDialog: TemplateRef<any>, item: Item) {
        $event?.preventDefault();
        $event?.stopPropagation();
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

    previous() {
        let year = this.rangeStart.getFullYear();
        let month = this.rangeStart.getMonth();
        if (month === 1) {
            month = 12;
            year--;
        } else {
            month--;
        }
        this.rangeStart = this.dateService.createDate(year, month, 1);
        this.rangeEnd = this.dateService.getMonthEnd(this.rangeStart);
    }

    next() {
        let year = this.rangeStart.getFullYear();
        let month = this.rangeStart.getMonth();
        if (month === 12) {
            month = 1;
            year++;
        } else {
            month++;
        }
        this.rangeStart = this.dateService.createDate(year, month, 1);
        this.rangeEnd = this.dateService.getMonthEnd(this.rangeStart);
    }
}
