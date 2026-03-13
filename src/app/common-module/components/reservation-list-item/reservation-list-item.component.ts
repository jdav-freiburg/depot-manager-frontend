import { Component, Input, OnDestroy, OnInit, OnChanges } from '@angular/core';
import { ApiService } from '../../_services';
import { Subject } from 'rxjs';
import { Item } from '../../_models';

@Component({
    selector: 'depot-reservation-list-item',
    templateUrl: './reservation-list-item.component.html',
    styleUrls: ['./reservation-list-item.component.scss'],
    standalone: false
})
export class ReservationListItemComponent implements OnInit, OnDestroy, OnChanges {
    @Input() item: Item;
    private destroyed$ = new Subject<void>();

    constructor(public api: ApiService) {}

    ngOnInit() {}

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    ngOnChanges(): void {}

    getItemPicturePreviewUrl(item: Item): string {
        return this.api.getPicturePreviewUrl(item.pictureId);
    }

    getItemPictureUrl(item: Item): string {
        return this.api.getPictureUrl(item.pictureId);
    }
}
