import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map} from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from './auth.service';
import MOCK_DATA from './data-mock';

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
    private readonly _loggedIn$ = new BehaviorSubject<boolean>(null);
    public readonly loggedIn$: Observable<boolean> = this._loggedIn$.asObservable();
    private readonly _user$ = new BehaviorSubject<User>(null);
    public readonly user$: Observable<User> = this._user$.asObservable();
    public readonly isAdmin$: Observable<boolean> = this.user$.pipe(
        map((user) => user && user.roles.includes('admin'))
    );
    public readonly isManager$: Observable<boolean> = this.user$.pipe(
        map((user) => user && (user.roles.includes('manager') || user.roles.includes('admin')))
    );
    private readonly _lastError$ = new BehaviorSubject<string>(null);
    public readonly lastError$: Observable<string> = this._lastError$.asObservable();

    private readonly _discoveryDocument$ = new BehaviorSubject<Record<string, any>>(null);
    public readonly discoveryDocument$ = this._discoveryDocument$.asObservable();

    public get isAdmin(): boolean {
        return this._user$.value?.roles.includes('admin');
    }

    public readonly userId$: Observable<string> = this.user$.pipe(map((user) => user?.sub));
    public get userId(): string {
        return this._user$.value?.sub;
    }

    constructor(private readonly router: Router) {
    }

    logout() {
        this._user$.next(null);
        this._loggedIn$.next(false);
        void this.router.navigateByUrl('/');
    }

    login(returnUrl?: string) {
        this._user$.next(MOCK_DATA.User);
        this._loggedIn$.next(true);
    }

    isSelf(userId: string): boolean {
        return this.userId === userId;
    }

    generatePassword(length?: number): string {
        return '';
    }
}
