import { Component, effect, Signal } from '@angular/core';
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NbButtonModule } from "@nebular/theme";
import { filter, map } from 'rxjs/operators';
import { AuthService } from 'src/app/common-module/_services';

@Component({
    imports: [
        NbButtonModule,
        RouterLink
    ],
    standalone: true,
    styles: `
        :host {
            display: grid;
            grid-gap: 1em;
            height: 100%;
            place-content: center;
        }
    `,
    template: `
        @if (lastError(); as error) {
            <p class="error-message">{{ error }}</p>
        }
        @if (loggedIn()) {
            <h2>Hi {{ name() }}!</h2>
            <p>
                <a nbButton routerLink="/reservations">
                    Zu den Reservierungen
                </a>
            </p>
        } @else {
            <button nbButton type="button" (click)="login()">Einloggen</button>
        }`
})
export class AuthenticationComponent {
    #returnUrl: string;

    loggedIn: Signal<boolean>;
    name: Signal<string>;
    lastError: Signal<string>;

    constructor(private readonly auth: AuthService, route: ActivatedRoute) {
        this.loggedIn = toSignal(auth.loggedIn$);
        this.lastError = toSignal(auth.lastError$);
        this.name = toSignal(auth.user$.pipe(
            filter(Boolean),
            map((user) => user.given_name)
        ));

        const queryParams = toSignal(route.queryParams);
        effect(() => {
            const params = queryParams();
            if (Object.hasOwnProperty.call(params, 'returnUrl')) {
                this.#returnUrl = decodeURIComponent(params.returnUrl);
            }
        })
    }

    logout() {
        this.auth.logout();
    }

    login() {
        this.auth.login(this.#returnUrl);
    }
}
