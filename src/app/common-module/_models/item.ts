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
