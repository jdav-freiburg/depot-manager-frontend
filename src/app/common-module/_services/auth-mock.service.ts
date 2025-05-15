import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from './auth.service';
import MOCK_DATA from './data-mock';

@Injectable({
    providedIn: 'root'
})
export class AuthMockService {
    readonly #loggedIn$ = new BehaviorSubject<boolean>(false);
    readonly loggedIn$: Observable<boolean> = this.#loggedIn$.asObservable();

    readonly #user$ = new BehaviorSubject<User | undefined>(undefined);
    readonly user$: Observable<User> = this.#user$.asObservable();

    readonly isAdmin$: Observable<boolean> = this.user$.pipe(
        map((user) => user && user.roles.includes('admin'))
    );
    readonly isManager$: Observable<boolean> = this.user$.pipe(
        map((user) => user && (user.roles.includes('manager') || user.roles.includes('admin')))
    );

    readonly #lastError$ = new ReplaySubject<string>(1);
    readonly lastError$: Observable<string> = this.#lastError$.asObservable();

    readonly #discoveryDocument$ = new ReplaySubject<Record<string, any>>(1);
    readonly discoveryDocument$ = this.#discoveryDocument$.asObservable();

    get isAdmin(): boolean {
        return this.#user$.value?.roles.includes('admin');
    }

    readonly userId$: Observable<string> = this.user$.pipe(map((user) => user?.sub));

    get userId(): string {
        return this.#user$.value?.sub;
    }

    constructor(private readonly router: Router) {
        this.login();
    }

    logout() {
        this.#user$.next(null);
        this.#loggedIn$.next(false);
        void this.router.navigateByUrl('/');
    }

    login(returnUrl?: string) {
        this.#user$.next(MOCK_DATA.User);
        this.#loggedIn$.next(true);
    }
}
