export interface User {
    sub: string;
    name: string;
    email: string;
    picture: string;
    phoneNumber?: string;
    teams?: string[];
}
