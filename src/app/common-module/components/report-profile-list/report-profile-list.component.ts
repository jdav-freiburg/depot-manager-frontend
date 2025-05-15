import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { shareReplay, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { ReportProfile } from '../../_models';
import { ReportService } from '../../_services';

@Component({
    selector: 'depot-report-profile-list',
    templateUrl: './report-profile-list.component.html',
    styleUrls: ['./report-profile-list.component.scss'],
    standalone: false
})
export class ReportProfileListComponent implements OnInit, OnDestroy {
    @Input() selectedReportProfile: string;
    @Input() required = false;
    @Output() selectReportProfile = new EventEmitter();

    private destroyed$ = new Subject<void>();
    reportProfiles$: Observable<ReportProfile[]>;

    constructor(private reportService: ReportService) {
        this.reportProfiles$ = this.reportService.profiles$.pipe(shareReplay(1), takeUntil(this.destroyed$));
    }

    noReportProfile() {
        this.selectReportProfile.emit(null);
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
