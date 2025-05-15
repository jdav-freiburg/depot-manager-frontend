import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ReportElement } from '../../../common-module/_models';
import { ApiService, ReportService } from '../../../common-module/_services';
import { ActivatedRoute, Router } from '@angular/router';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';

interface ReportElementWithOriginalOrder extends ReportElement {
    originalOrder: number;
}

interface ReportElementEntry {
    data: ReportElementWithOriginalOrder;
}

@Component({
    selector: 'depot-report-elements',
    templateUrl: './report-elements.component.html',
    styleUrls: ['./report-elements.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ReportElementsComponent implements OnInit, OnDestroy {
    loading: boolean;

    showGrouped$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    allColumns = ['title', 'description', 'action'];

    dataSource: NbTreeGridDataSource<ReportElementEntry> = null;
    sorting: NbSortRequest = { column: 'originalOrder', direction: NbSortDirection.ASCENDING };

    filter: string;

    private destroyed$ = new Subject<void>();

    constructor(
        public api: ApiService,
        public reportService: ReportService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private dataSourceBuilder: NbTreeGridDataSourceBuilder<ReportElementEntry>,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit() {
        const elements$ = this.reportService.elements$.pipe(
            map((elements) => elements.map((element, index) => ({ data: { ...element, originalOrder: index } }))),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        elements$.subscribe((entries) => {
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

    onClickReportElement($event: MouseEvent, reportElement: ReportElement) {
        $event.stopPropagation();
        $event.preventDefault();
        this.router.navigate([reportElement.id], { relativeTo: this.activatedRoute.parent });
    }
}
