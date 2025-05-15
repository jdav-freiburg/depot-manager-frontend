import { ReportState } from './report-element';
import { TotalReportState } from './report-profile';

export enum ItemCondition {
    Good = 'good',
    Ok = 'ok',
    Bad = 'bad',
    Gone = 'gone',
}

export interface StrChange {
    previous?: string;
    next?: string;
}

export interface IdChange {
    previous?: string;
    next?: string;
}

export interface DateChange {
    previous?: string;
    next?: string;
}

export interface TagsChange {
    previous: string[];
    next: string[];
}

export interface TotalReportStateChange {
    previous: TotalReportState;
    next: TotalReportState;
}

export interface ItemConditionChange {
    previous: ItemCondition;
    next: ItemCondition;
}

export interface ItemStateChanges {
    externalId?: StrChange;

    manufacturer: StrChange;
    model: StrChange;
    serialNumber: StrChange;
    manufactureDate: DateChange;
    purchaseDate: DateChange;
    firstUseDate: DateChange;

    name?: StrChange;
    description?: StrChange;

    reportProfileId?: IdChange;

    totalReportState?: TotalReportStateChange;
    condition?: ItemConditionChange;
    conditionComment?: StrChange;

    lastService?: DateChange;

    pictureId?: StrChange;

    groupId?: StrChange;

    tags?: TagsChange;

    bayId?: IdChange;

    reservationId?: IdChange;
}

export interface ItemReport {
    reportElementId: string;
    state: ReportState;
    comment?: string;
}

export interface ItemState {
    id: string;
    itemId: string;

    timestamp: string;

    changes: ItemStateChanges;
    report?: ItemReport[];

    userId: string;

    comment?: string;
}
