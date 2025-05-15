import { Component, Input, OnDestroy, OnInit, TemplateRef, OnChanges } from '@angular/core';
import { ApiService } from '../../_services';
import { Subject } from 'rxjs';
import { Item } from '../../_models';
import { NbDialogService } from '@nebular/theme';

@Component({
    selector: 'depot-reservation-list-item',
    templateUrl: './reservation-list-item.component.html',
    styleUrls: ['./reservation-list-item.component.scss'],
    standalone: false
})
export class ReservationListItemComponent implements OnInit, OnDestroy, OnChanges {
    @Input() item: Item;
    private destroyed$ = new Subject<void>();

    imageLoading: boolean;

    constructor(public api: ApiService, private dialogService: NbDialogService) {}

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

    openDialog($event: MouseEvent | null, imageDialog: TemplateRef<any>, item: Item) {
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
}
