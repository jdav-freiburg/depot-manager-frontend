import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ItemState } from '../../_models';
import { ApiService } from '../../_services';

interface FieldItem {
    key: string;
    value: any;
}

interface ItemStateWithArray extends ItemState {
    changesArray: FieldItem[];
}

@Component({
    selector: 'depot-item-details-history',
    templateUrl: './item-details-history.component.html',
    styleUrls: ['./item-details-history.component.scss'],
    standalone: false
})
export class ItemDetailsHistoryComponent implements OnChanges {
    @Input() states: ItemStateWithArray[];
    @Input() noReports = false;
    @Input() onlyReports = false;

    displayStates: ItemStateWithArray[];

    constructor(private api: ApiService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.states) {
            if (this.noReports) {
                this.displayStates = this.states.filter((state) => state.comment && state.changesArray.length > 0);
            } else if (this.onlyReports) {
                this.displayStates = this.states.filter((state) => state.comment && state.report != null);
            } else {
                this.displayStates = this.states.filter((state) => state.comment);
            }
        }
    }

    getPicturePreviewUrl(pictureId: string): string {
        return this.api.getPicturePreviewUrl(pictureId);
    }

    stateFields(state: ItemState): FieldItem[] {
        return Object.entries(state.changes).map(([key, value]) => ({ key, value }));
    }
}
