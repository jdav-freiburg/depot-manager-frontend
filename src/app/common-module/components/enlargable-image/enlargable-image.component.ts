import { Component, Input, TemplateRef } from '@angular/core';
import { NbDialogService } from '@nebular/theme';

@Component({
    selector: 'depot-enlargable-image',
    templateUrl: './enlargable-image.component.html',
    styleUrls: ['./enlargable-image.component.scss'],
    standalone: false
})
export class EnlargableImageComponent {
    @Input() previewUrl: string;
    @Input() fullSizeUrl: string;
    @Input() alt: string = 'Image';
    @Input() cssClass: string = '';

    imageLoading: boolean;

    constructor(private dialogService: NbDialogService) {}

    openDialog($event: MouseEvent | null, imageDialog: TemplateRef<any>) {
        $event?.preventDefault();
        $event?.stopPropagation();
        this.imageLoading = true;
        this.dialogService.open(imageDialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            hasScroll: false,
            autoFocus: true,
        });
    }
}
