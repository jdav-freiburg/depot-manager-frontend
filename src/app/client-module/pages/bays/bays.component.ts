import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Bay } from '../../../common-module/_models';
import { ApiService, ItemsService } from '../../../common-module/_services';
import { ActivatedRoute, Router } from '@angular/router';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';

interface BayWithOriginalOrder extends Bay {
    originalOrder: number;
}

interface BayEntry {
    data: BayWithOriginalOrder;
}

@Component({
    selector: 'depot-bays',
    templateUrl: './bays.component.html',
    styleUrls: ['./bays.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class BaysComponent implements OnInit, OnDestroy {
    loading: boolean;

    showGrouped$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    allColumns = ['externalId', 'name', 'description', 'action'];

    dataSource: NbTreeGridDataSource<BayEntry> = null;
    sorting: NbSortRequest = { column: 'originalOrder', direction: NbSortDirection.ASCENDING };

    filter: string;

    private destroyed$ = new Subject<void>();

    constructor(
        public api: ApiService,
        public itemsService: ItemsService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private dataSourceBuilder: NbTreeGridDataSourceBuilder<BayEntry>,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit() {
        const bays$ = this.itemsService.bays$.pipe(
            map(bays => bays.map((bay, index) => ({ data: { ...bay, originalOrder: index } }))),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        bays$.subscribe(entries => {
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

    onClickBay($event: MouseEvent, bay: Bay) {
        $event.stopPropagation();
        $event.preventDefault();
        this.router.navigate([bay.id], { relativeTo: this.activatedRoute.parent });
    }
}
