import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { shareReplay, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { ReportElement } from '../../_models';
import { ReportService } from '../../_services';

@Component({
    selector: 'depot-report-element-list',
    templateUrl: './report-element-list.component.html',
    styleUrls: ['./report-element-list.component.scss'],
    standalone: false
})
export class ReportElementListComponent implements OnInit, OnDestroy {
    @Input() selectedReportElement: string;
    @Input() required = false;
    @Output() selectReportElement = new EventEmitter();

    private destroyed$ = new Subject<void>();
    reportElements$: Observable<ReportElement[]>;

    constructor(private reportService: ReportService) {
        this.reportElements$ = this.reportService.elements$.pipe(shareReplay(1), takeUntil(this.destroyed$));
    }

    noReportElement() {
        this.selectReportElement.emit(null);
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
