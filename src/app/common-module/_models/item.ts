import { ItemCondition, ItemReport } from './item-state';
import { TotalReportState } from './report-profile';

export interface Item {
    id: string;
    externalId?: string;

    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    manufactureDate?: string;
    purchaseDate?: string;
    firstUseDate?: string;

    name: string;
    /**
     * Set by UI. This attribute isn't part of DB.
     * There is an internal contract we can rely on:
     *  The very first entry of all items with the same `group_id` value, is the actual group.
     *
     * A group is the same thing as an item but the UI displays it a bit different.
     * The item that is a group is used to group similar items...
     *
     * @see groupId
     */
    isGroup: boolean;

    description?: string;

    reportProfileId?: string;

    totalReportState?: TotalReportState;
    condition: ItemCondition;
    conditionComment?: string;

    lastService?: string;

    pictureId?: string;

    groupId?: string;

    tags: string[];

    bayId?: string;

    reservationId?: string;
}

export interface ItemInWrite {
    externalId?: string;

    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    manufactureDate?: string;
    purchaseDate?: string;
    firstUseDate?: string;

    name: string;
    description?: string;

    reportProfileId?: string;

    totalReportState: TotalReportState;
    condition: ItemCondition;
    conditionComment?: string;

    pictureId?: string;

    groupId?: string;

    bayId?: string;

    tags: string[];

    changeComment: string;
}

export interface ReportItemInWrite extends ItemInWrite {
    lastService?: string;
    totalReportState: TotalReportState;
    report: ItemReport[];
}
