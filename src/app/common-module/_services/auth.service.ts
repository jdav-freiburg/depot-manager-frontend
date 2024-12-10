import { Observable, BehaviorSubject, Subject, ReplaySubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { EnvService } from './env.service';
import { OAuthService, OAuthErrorEvent, OAuthSuccessEvent } from 'angular-oauth2-oidc';
import { filter, map, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';

export interface User {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    zoneinfo: string;
    roles: string[];
    teams: string[];
    email: string;
    phone_number: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly #loggedIn$ = new ReplaySubject<boolean>(1);
    readonly loggedIn$: Observable<boolean> = this.#loggedIn$.asObservable();

    readonly #user$ = new BehaviorSubject<User | undefined>(undefined);
    readonly user$ = this.#user$.asObservable();
    readonly isAdmin$ = this.user$.pipe(
        map((user) => user && user.roles.includes('admin'))
    );

    readonly isManager$ = this.user$.pipe(
        map((user) => user && (user.roles.includes('manager') || user.roles.includes('admin')))
    );

    readonly #discoveryDocument$ = new ReplaySubject<Record<string, any>>(1);
    readonly discoveryDocument$ = this.#discoveryDocument$.asObservable();

    readonly #lastError$ = new BehaviorSubject<string | undefined>(undefined);
    readonly lastError$ = this.#lastError$.asObservable();

    get isAdmin(): boolean {
        return this.#user$.value?.roles.includes('admin');
    }

    get isManager(): boolean {
        return this.#user$.value?.roles.includes('manager') || this.#user$.value?.roles.includes('admin');
    }

    readonly userId$ = this.user$.pipe(map((user) => user?.sub));

    get userId(): string {
        return this.#user$.value?.sub;
    }

    constructor(private oauthService: OAuthService, env: EnvService, private router: Router, toastr: NbToastrService) {
        this.oauthService.configure({
            // Url of the Identity Provider
            issuer: env.oicdIssuer,

            // URL of the SPA to redirect the user to after login
            // redirectUri: window.location.origin,
            redirectUri: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            silentRefreshRedirectUri: window.location.origin + '/assets/silent-refresh.html',

            requireHttps: window.location.origin.startsWith('https'),

            // The SPA's id. The SPA is registerd with this id at the auth-server
            clientId: env.oicdClientId,

            // Just needed if your auth server demands a secret. In general, this
            // is a sign that the auth server is not configured with SPAs in mind
            // and it might not enforce further best practices vital for security
            // such applications.
            // dummyClientSecret: 'secret',

            responseType: 'code',

            // set the scope for the permissions the client should request
            // The first four are defined by OIDC.
            // Important: Request offline_access to get a refresh token
            // The api scope is a usecase specific one
            scope: 'openid profile email offline_access phone teams *users',

            showDebugInformation: true,

            useSilentRefresh: true,
            sessionChecksEnabled: true,
        });

        this.oauthService.events
            .pipe(filter((event) => event.type !== 'session_unchanged'))
            .subscribe((e) => console.log('Auth:', e));

        this.oauthService.events
            .pipe(
                filter((event) => event.type === 'discovery_document_loaded'),
                map((discoveryEvent: OAuthSuccessEvent) => discoveryEvent.info?.discoveryDocument)
            )
            .subscribe(this.#discoveryDocument$);

        this.oauthService.events
            .pipe(
                filter((e) => e.type === 'session_terminated' || e.type === 'token_received'),
                map((e) => e.type === 'token_received')
            )
            .subscribe((loggedIn) => {
                if (this.#lastError$.value) {
                    this.#lastError$.next(undefined);
                }
                this.#loggedIn$.next(loggedIn);
                if (this.oauthService.state) {
                    const redirectUri = decodeURIComponent(this.oauthService.state);
                    console.log('Redirecting to', redirectUri);
                    this.router.navigateByUrl(redirectUri);
                    this.oauthService.state = null;
                } else if (!loggedIn) {
                    router.navigate(['/']);
                }
            });

        this.oauthService.events
            .pipe(
                filter((e) => e.type === 'code_error'),
                map(
                    (e: OAuthErrorEvent) =>
                        (e.params as any)?.error_description ?? (e.params as any)?.error ?? e.reason.toString()
                )
            )
            .subscribe((error: string) => {
                toastr.danger(error, 'Authentication Error');
                this.#lastError$.next(error);
            });

        // Automatically load user profile
        this.oauthService.events
            .pipe(filter((e) => e.type === 'token_received'))
            .subscribe(() => this.oauthService.loadUserProfile());
        this.oauthService.events
            .pipe(
                filter((e) => e.type === 'user_profile_loaded'),
                map(() => this.oauthService.getIdentityClaims() as User)
            )
            .subscribe(this.#user$);
        if (this.oauthService.hasValidIdToken()) {
            this.#loggedIn$.next(true);
            const identityClaims = this.oauthService.getIdentityClaims();
            if (identityClaims) {
                this.#user$.next(identityClaims as User);
            } else {
                this.oauthService.loadUserProfile();
            }
        }

        this.oauthService.loadDiscoveryDocumentAndTryLogin();
        this.oauthService.setupAutomaticSilentRefresh();
    }

    logout() {
        this.discoveryDocument$
            .pipe(
                filter((d) => !!d),
                take(1)
            )
            .toPromise()
            .then(() => {
                if (this.oauthService.hasValidIdToken()) {
                    this.oauthService.revokeTokenAndLogout();
                } else {
                    this.oauthService.revokeTokenAndLogout();
                    this.router.navigateByUrl('/');
                }
            });
    }

    login(returnUrl?: string) {
        this.oauthService.initLoginFlow(returnUrl);
    }
}
