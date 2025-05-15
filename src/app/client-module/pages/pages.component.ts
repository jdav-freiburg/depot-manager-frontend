import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService, AuthService } from '../../common-module/_services';
import { NbMenuItem, NbSidebarService, NbMenuService } from '@nebular/theme';
import { Router, NavigationStart, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { Subject, Observable, combineLatest } from 'rxjs';

@Component({
    selector: 'depot-pages-root',
    templateUrl: './pages.component.html',
    styleUrls: ['./pages.component.scss'],
    standalone: false
})
export class PagesComponent implements OnDestroy {
    menuItems: NbMenuItem[] = [];

    menuItemsUser: NbMenuItem[] = [
        {
            title: 'Startseite',
            link: '/',
            home: true,
        },
        {
            title: 'Reservierungen',
            link: '/reservations',
            pathMatch: 'prefix',
        },
        {
            title: 'Ausloggen',
            link: '/logout',
        },
    ];

    menuItemsManager: NbMenuItem[] = [
        {
            title: 'Startseite',
            link: '/',
            home: true,
        },
        {
            title: 'Reservierungen',
            link: '/reservations',
            pathMatch: 'prefix',
        },
        {
            title: 'Ausrüstung',
            link: '/items',
            pathMatch: 'prefix',
        },
        {
            title: 'Kalender',
            link: '/items-table',
            pathMatch: 'prefix',
        },
        {
            title: 'Ausloggen',
            link: '/logout',
        },
    ];

    menuItemsAdmin: NbMenuItem[] = [
        {
            title: 'Startseite',
            link: '/',
            home: true,
        },
        {
            title: 'Reservierungen',
            link: '/reservations',
            pathMatch: 'prefix',
        },
        {
            title: 'Ausrüstung',
            link: '/items',
            pathMatch: 'prefix',
        },
        {
            title: 'Kalender',
            link: '/items-table',
            pathMatch: 'prefix',
        },
        {
            title: 'Report Profiles',
            link: '/report-profiles',
            pathMatch: 'prefix',
        },
        {
            title: 'Report Elements',
            link: '/report-elements',
            pathMatch: 'prefix',
        },
        {
            title: 'Ausloggen',
            link: '/logout',
        },
    ];

    destroyed$: Subject<void> = new Subject();
    loggedIn$: Observable<boolean>;
    name$: Observable<string>;

    constructor(
        private authService: AuthService,
        public sidebarService: NbSidebarService,
        public router: Router,
        public activatedRoute: ActivatedRoute
    ) {
        this.loggedIn$ = authService.loggedIn$;
        this.name$ = authService.user$.pipe(
            filter((user) => !!user),
            map((user) => user.given_name)
        );
        combineLatest([authService.isAdmin$, authService.isManager$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([isAdmin, isManager]) => {
                if (isAdmin) {
                    this.menuItems = this.menuItemsAdmin;
                } else if (isManager) {
                    this.menuItems = this.menuItemsManager;
                } else {
                    this.menuItems = this.menuItemsUser;
                }
            });
        this.loggedIn$.pipe(takeUntil(this.destroyed$)).subscribe((loggedIn) => {
            if (loggedIn) {
                sidebarService.expand('left');
            } else {
                sidebarService.collapse('left');
            }
        });
    }

    ngOnDestroy() {
        this.destroyed$.next();
    }

    logout() {
        this.authService.logout();
    }

    login() {
        this.authService.login();
    }
}
