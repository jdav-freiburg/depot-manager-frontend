import { Component, Input } from '@angular/core';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/common-module/_services';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: './authentication.component.html',
    styleUrls: ['./authentication.component.scss'],
    standalone: false
})
export class AuthenticationComponent {
    @Input() returnUrl: string;

    loggedIn$: Observable<boolean>;
    name$: Observable<string>;
    lastError$: Observable<string>;

    constructor(private auth: AuthService, private route: ActivatedRoute) {
        this.loggedIn$ = auth.loggedIn$;
        this.lastError$ = auth.lastError$;
        this.name$ = auth.user$.pipe(filter((user) => !!user)).pipe(map((user) => user.given_name));

        route.queryParams.subscribe((params) => {
            if (Object.hasOwnProperty.call(params, 'returnUrl')) {
                this.returnUrl = decodeURIComponent(params.returnUrl);
            }
        });
    }

    logout() {
        this.auth.logout();
    }

    login() {
        this.auth.login(this.returnUrl);
    }
}
