export enum ReservationType {
    Private = 'private',
    Team = 'team',
}

export enum ReservationState {
    Reserved = 'reserved',
    Taken = 'taken',
    Returned = 'returned',
    ReturnProblem = 'return-problem',
}

export interface ReservationItem {
    itemId: string;
    state: ReservationState;
}

export interface Reservation {
    id: string;
    type: ReservationType;
    code?: string;
    state: ReservationState;
    active?: boolean;
    name: string;

    start: Date | string;
    end: Date | string;
    userId?: string;

    teamId: string;

    contact: string;

    items?: ReservationItem[];
}

export interface ReservationInWrite {
    type: ReservationType;
    name: string;

    start: Date | string;
    end: Date | string;

    userId?: string;
    teamId: string;

    contact: string;

    items?: string[];
}

export enum ReservationAction {
    Take = 'take',
    Return = 'return',
    Remove = 'remove',
    Broken = 'broken',
    Missing = 'missing',
}

export interface ReservationItemState {
    itemId: string;
    action: ReservationAction;
    comment?: string;
}

export interface ReservationActionInWrite {
    items: ReservationItemState[];
    comment?: string;
}
