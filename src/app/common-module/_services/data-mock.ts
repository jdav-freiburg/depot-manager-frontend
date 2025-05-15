import { AuthUserModel, Bay, Item, ItemCondition, ItemState, Reservation, ReservationState, ReservationType } from '../_models';
import { User } from './auth.service';

const User: User = {
    roles: ['admin', 'manager'],
    teams: ['TEAM001'],
    zoneinfo: '',
    sub: '12345',
    name: 'Max Mustermann',
    family_name: 'Mustermann',
    given_name: 'Max',
    picture: 'https://example.com/profile.jpg',
    email: 'max.mustermann@gmail.com',
    phone_number: '+49 123 456789'
};

const AuthUser: AuthUserModel = {
    email: User.email,
    name: User.name,
    picture: User.picture,
    sub: User.sub,
    roles: ['admin', 'manager'],
    groups: ['gruppeA', 'gruppeB'],
    family_name: '',
    given_name: '',
    phone_number: ''
};

const Item1: Item = {
    id: '0000001',
    externalId: 'EXT001',
    name: 'Eispickel',
    description: 'Für Experten im alpinen Gelände.',
    condition: ItemCondition.Good,
    conditionComment: 'Leichter Gebrauch, keine Schäden.',
    purchaseDate: new Date('2020-05-01').toISOString(),
    lastService: new Date('2023-11-01').toISOString(),
    pictureId: 'PIC001',
    groupId: 'GRP001',
    bayId: 'BAY001',
    tags: ['Bergsteigen', 'Eis'],
};

const Item2: Item = {
    id: '0000002',
    externalId: 'EXT002',
    name: 'Steigeisen',
    description: 'Perfekt für Winterwanderungen und Gletscher.',
    condition: ItemCondition.Good,
    conditionComment: 'Fast wie neu, nur einmal benutzt.',
    purchaseDate: new Date('2021-03-15').toISOString(),
    lastService: new Date('2023-10-20').toISOString(),
    pictureId: 'PIC002',
    groupId: 'GRP001',
    bayId: 'BAY002',
    tags: ['Winter', 'Berg'],
};

const Item3: Item = {
    id: '0000002',
    externalId: 'EXT002',
    name: 'Steigeisen BD',
    description: 'Perfekt für Winterwanderungen und Gletscher.',
    condition: ItemCondition.Bad,
    conditionComment: 'Kaputt',
    purchaseDate: new Date('2016-03-15').toISOString(),
    lastService: new Date('2024-10-20').toISOString(),
    pictureId: 'id',
    groupId: 'GRP001',
    bayId: 'BAY002',
    tags: ['Winter', 'Berg'],
};

const Bay1: Bay = {
    id: Item1.id,
    externalId: Item1.externalId,
    name: Item1.name,
    description: Item1.description,
};

const Bay2: Bay = {
    id: Item2.id,
    externalId: Item2.externalId,
    name: Item2.name,
    description: Item2.description,
};

const changes: Record<
    keyof Item,
    { previous: any; next: any }
> = {
    id: { previous: '0000001', next: '0000002' },
    externalId: { previous: 'EXT001', next: 'EXT002' },
    name: { previous: 'Eispickel', next: 'Steigeisen' },
    description: { previous: 'Für Experten im alpinen Gelände.', next: 'Perfekt für Winterwanderungen und Gletscher.' },
    condition: { previous: ItemCondition.Good, next: ItemCondition.Good },
    conditionComment: { previous: 'Leichter Gebrauch, keine Schäden.', next: 'Fast wie neu, nur einmal benutzt.' },
    purchaseDate: { previous: '2020-05-01', next: '2021-03-15' },
    lastService: { previous: '2023-11-01', next: '2023-10-20' },
    pictureId: { previous: 'PIC001', next: 'PIC002' },
    groupId: { previous: 'GRP001', next: 'GRP001' },
    bayId: { previous: 'BAY001', next: 'BAY002' },
    tags: { previous: ['Bergsteigen', 'Eis'], next: ['Winter', 'Berg'] },
    manufacturer: { previous: null, next: null },
    model: { previous: null, next: null },
    serialNumber: { previous: null, next: null },
    manufactureDate: { previous: null, next: null },
    firstUseDate: { previous: null, next: null },
    reportProfileId: { previous: null, next: null },
    totalReportState: { previous: null, next: null },
    reservationId: { previous: null, next: null },
};

const ItemState: ItemState = {
    ...Item1,
    id: 'STATE001',
    itemId: Item1.id,
    timestamp: new Date().toISOString(),
    changes,
    userId: User.sub,
    comment: 'Änderung des Zustands aufgrund von Wartung.',
};

const Reservation: Reservation = {
    active: true,
    code: '',
    state: ReservationState.Reserved,
    id: 'RES001',
    type: ReservationType.Team,
    name: 'Reservierung für Team A',
    start: new Date('2024-01-15T08:00:00Z').toISOString(),
    end: new Date('2024-01-20T18:00:00Z').toISOString(),
    userId: User.sub,
    teamId: 'TEAM001',
    contact: 'teamleiter@beispiel.de',
    items: [{ itemId: Item1.id, state: ReservationState.Reserved }, {itemId: Item2.id, state: ReservationState.Returned}],
};

const Reservation2: Reservation = {
    active: false,
    code: '',
    state: ReservationState.Returned,
    id: 'RES002',
    type: ReservationType.Private,
    name: 'Reservierung für Mr.DAV',
    start: new Date('2025-02-11T08:00:00Z').toISOString(),
    end: new Date('2025-02-15T18:00:00Z').toISOString(),
    userId: User.sub,
    teamId: 'TEAM001',
    contact: 'teamleiter@beispiel.de',
    items: [{ itemId: Item1.id, state: ReservationState.Reserved }]
};

const MOCK_DATA = { User, AuthUser, Item1, Item2, Item3, Bay1, Bay2, ItemState, Reservation, Reservation2 };
export default MOCK_DATA;
