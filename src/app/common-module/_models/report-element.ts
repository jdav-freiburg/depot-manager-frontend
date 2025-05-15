export enum ReportState {
    NotApplicable = 'not-applicable',
    Good = 'good',
    Monitor = 'monitor',
    Repair = 'repair',
    Retire = 'retire',
}

export interface ReportElement {
    id: string;
    title: string;
    description: string;
}

export interface ReportElementInWrite {
    title: string;
    description: string;
}
