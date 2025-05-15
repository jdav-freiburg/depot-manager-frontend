import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { shareReplay, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { Bay } from '../../_models';
import { ItemsService } from '../../_services';

@Component({
    selector: 'depot-bay-list',
    templateUrl: './bay-list.component.html',
    styleUrls: ['./bay-list.component.scss'],
    standalone: false
})
export class BayListComponent implements OnInit, OnDestroy {
    @Input() selectedBay: string;
    @Input() required = false;
    @Output() selectBay = new EventEmitter();

    private destroyed$ = new Subject<void>();
    bays$: Observable<Bay[]>;

    constructor(private itemsService: ItemsService) {
        this.bays$ = this.itemsService.bays$.pipe(shareReplay(1), takeUntil(this.destroyed$));
    }

    noBay() {
        this.selectBay.emit(null);
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
