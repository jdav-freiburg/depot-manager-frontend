import { ChangeDetectorRef, Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ReportElement, ReportProfile } from '../../../common-module/_models';
import { ApiService, ReportService } from '../../../common-module/_services';
import { ActivatedRoute, Router } from '@angular/router';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';

interface ReportProfileWithOriginalOrderAndSteps extends ReportProfile {
    originalOrder: number;

    isElement: boolean;
}

interface ReportElementEntry extends ReportElement {
    originalOrder: number;
    name: string;

    isElement: boolean;
}

interface ReportProfileEntry {
    data: ReportProfileWithOriginalOrderAndSteps;

    children: ReportElementEntry[];
}

@Component({
    selector: 'depot-report-profiles',
    templateUrl: './report-profiles.component.html',
    styleUrls: ['./report-profiles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ReportProfilesComponent implements OnInit, OnDestroy {
    loading: boolean;

    showGrouped$: BehaviorSubject<boolean> = new BehaviorSubject(true);

    allColumns = ['name', 'description', 'action'];

    dataSource: NbTreeGridDataSource<ReportProfileEntry> = null;
    sorting: NbSortRequest = { column: 'originalOrder', direction: NbSortDirection.ASCENDING };

    filter: string;

    private destroyed$ = new Subject<void>();

    constructor(
        public api: ApiService,
        public reportService: ReportService,
        public activatedRoute: ActivatedRoute,
        public router: Router,
        private dataSourceBuilder: NbTreeGridDataSourceBuilder<ReportProfileEntry>,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit() {
        const elements$ = this.reportService.profilesWithElements$.pipe(
            map((profiles) =>
                profiles.map((profile, index) => ({
                    data: {
                        ...profile,
                        originalOrder: index,
                        isElement: false,
                    },
                    children: profile.elements.map((element, eIndex) => ({
                        data: { ...element, name: element.title, originalOrder: eIndex, isElement: true },
                    })),
                }))
            ),
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

    onClickReportProfile(
        $event: MouseEvent,
        reportProfile: ReportProfileWithOriginalOrderAndSteps | ReportElementEntry
    ) {
        $event.stopPropagation();
        $event.preventDefault();
        if (reportProfile.isElement) {
            this.router.navigate(['..', 'report-elements', reportProfile.id], {
                relativeTo: this.activatedRoute.parent,
            });
        } else {
            this.router.navigate([reportProfile.id], { relativeTo: this.activatedRoute.parent });
        }
    }
}
