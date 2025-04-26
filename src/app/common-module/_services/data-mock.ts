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

const MOCK_DATA = { User };
export default MOCK_DATA;
