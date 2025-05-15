export enum TotalReportState {
    Fit = 'fit',
    Unfit = 'unfit',
}

export interface ReportProfile {
    id: string;
    name: string;
    description: string;
    elements: string[];
}

export interface ReportProfileInWrite {
    name: string;
    description: string;
    elements: string[];
}
