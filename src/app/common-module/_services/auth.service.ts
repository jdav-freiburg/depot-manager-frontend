import { Observable, BehaviorSubject } from 'rxjs';
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

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly _loggedIn$ = new BehaviorSubject<boolean>(null);
    public readonly loggedIn$: Observable<boolean> = this._loggedIn$.asObservable();
    private readonly _user$ = new BehaviorSubject<User>(null);
    public readonly user$: Observable<User> = this._user$.asObservable();
    public readonly isAdmin$: Observable<boolean> = this.user$.pipe(
        map((user) => user && user.roles.includes('admin'))
    );
    private readonly _lastError$ = new BehaviorSubject<string>(null);
    public readonly lastError$: Observable<string> = this._lastError$.asObservable();

    public readonly isManager$: Observable<boolean> = this.user$.pipe(
        map((user) => user && (user.roles.includes('manager') || user.roles.includes('admin')))
    );

    private readonly _discoveryDocument$ = new BehaviorSubject<Record<string, any>>(null);
    public readonly discoveryDocument$ = this._discoveryDocument$.asObservable();

    public get isAdmin(): boolean {
        return this._user$.value?.roles.includes('admin');
    }

    public get isManager(): boolean {
        return this._user$.value?.roles.includes('manager') || this._user$.value?.roles.includes('admin');
    }

    public readonly userId$: Observable<string> = this.user$.pipe(map((user) => user?.sub));
    public get userId(): string {
        return this._user$.value?.sub;
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
            .subscribe(this._discoveryDocument$);

        this.oauthService.events
            .pipe(
                filter((e) => e.type === 'session_terminated' || e.type === 'token_received'),
                map((e) => e.type === 'token_received')
            )
            .subscribe((loggedIn) => {
                if (this._lastError$.value !== null) {
                    this._lastError$.next(null);
                }
                this._loggedIn$.next(loggedIn);
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
                this._lastError$.next(error);
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
            .subscribe(this._user$);
        if (this.oauthService.hasValidIdToken()) {
            this._loggedIn$.next(true);
            const identityClaims = this.oauthService.getIdentityClaims();
            if (identityClaims) {
                this._user$.next(identityClaims as User);
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

    isSelf(userId: string): boolean {
        return this.userId === userId;
    }

    generatePassword(length?: number): string {
        if (!window.crypto?.getRandomValues) {
            return;
        }
        if (length == null) {
            length = 24;
        }

        const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678901=';
        const randomData = new Uint8Array(length);
        window.crypto.getRandomValues(randomData);
        let result = '';
        let a: number;
        let b: number;
        let c: number;
        let bits: number;
        let i = 0;
        while (i < randomData.length) {
            a = randomData[i++];
            b = randomData[i++];
            c = randomData[i++];
            // @ts-ignore
            bits = (a << 16) | (b << 8) | c;
            // @ts-ignore
            result +=
                b64.charAt((bits >> 18) & 63) +
                b64.charAt((bits >> 12) & 63) +
                b64.charAt((bits >> 6) & 63) +
                b64.charAt(bits & 63);
        }
        return result;
    }
}
