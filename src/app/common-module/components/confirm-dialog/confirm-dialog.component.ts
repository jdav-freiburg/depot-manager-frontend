import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    standalone: false
})
export class ConfirmDialogComponent {
    @Input() title: string;
    @Input() message: string;
    @Input() cancelTitle: string;
    @Input() confirmTitle: string;
    @Input() cancelStatus?: 'success' | 'danger' | 'warning';
    @Input() confirmStatus?: 'success' | 'danger' | 'warning';

    constructor(protected dialogRef: NbDialogRef<ConfirmDialogComponent>) {}

    cancel() {
        this.dialogRef.close();
    }

    confirm() {
        this.dialogRef.close(true);
    }
}
