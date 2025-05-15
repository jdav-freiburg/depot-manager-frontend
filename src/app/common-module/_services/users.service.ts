import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { switchMap, tap, shareReplay } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../_models';
import { AuthService } from './auth.service';
import { UpdateService } from './update.service';

@Injectable({
    providedIn: 'root',
})
export class UsersService {
    private _usersById: Record<string, User> = Object.create(null);
    private _usersFetch: Record<string, Observable<User>> = Object.create(null);
    private _allUsers$?: Observable<User[]>;

    constructor(private api: ApiService, authService: AuthService, private updateService: UpdateService) {
        authService.user$.subscribe(
            (user) => (this._usersById[user.sub] = { ...user, phoneNumber: user.phone_number })
        );
    }

    getUser(userId?: string): Observable<User> {
        if (userId == null) {
            return of(null);
        }
        if (Object.hasOwnProperty.call(this._usersById, userId)) {
            if (this._usersById[userId] == null) {
                return throwError({ detail: `Unknown User ${userId}` });
            }
            return of(this._usersById[userId]);
        } else if (Object.hasOwnProperty.call(this._usersFetch, userId)) {
            return this._usersFetch[userId];
        } else if (this._allUsers$ != null) {
            return this._allUsers$.pipe(
                switchMap(() => {
                    if (!this._usersById[userId]) {
                        throw new Error(`Unknown User ${userId}`);
                    }
                    return of(this._usersById[userId]);
                }),
                shareReplay(1)
            );
        } else {
            return (this._usersFetch[userId] = this.api.getUser(userId).pipe(
                tap((user) => (this._usersById[user.sub] = user)),
                shareReplay(1)
            ));
        }
    }

    allUsers(): Observable<User[]> {
        if (this._allUsers$ == null) {
            this._allUsers$ = this.updateService.updateUsers$.pipe(
                switchMap(() => this.api.getUsers()),
                tap((users) => users.forEach((user) => (this._usersById[user.sub] = user))),
                shareReplay(1)
            );
        }
        return this._allUsers$;
    }

    getTeam(teamId: string): Observable<string> {
        return of(teamId);
    }

    reload() {
        this.updateService.updateUsers$.next();
        this._usersById = Object.create(null);
        this._usersFetch = Object.create(null);
    }
}
