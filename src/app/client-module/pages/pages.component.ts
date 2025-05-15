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
            title: 'Home',
            link: '/',
            home: true,
            icon: 'home',
        },
        {
            title: 'Reservations',
            link: '/reservations',
            pathMatch: 'prefix',
            icon: 'calendar',
        },
        {
            title: 'Logout',
            link: '/logout',
            icon: 'log-out',
        },
    ];

    menuItemsManager: NbMenuItem[] = [
        {
            title: 'Home',
            link: '/',
            home: true,
            icon: 'home',
        },
        {
            title: 'Reservations',
            link: '/reservations',
            pathMatch: 'prefix',
            icon: 'calendar',
        },
        {
            title: 'Items',
            link: '/items',
            pathMatch: 'prefix',
            icon: 'cube',
        },
        {
            title: 'Items Table',
            link: '/items-table',
            pathMatch: 'prefix',
            icon: 'cube',
        },
        {
            title: 'Logout',
            link: '/logout',
            icon: 'log-out',
        },
    ];

    menuItemsAdmin: NbMenuItem[] = [
        {
            title: 'Home',
            link: '/',
            home: true,
            icon: 'home',
        },
        {
            title: 'Reservations',
            link: '/reservations',
            pathMatch: 'prefix',
            icon: 'calendar',
        },
        {
            title: 'Items',
            link: '/items',
            pathMatch: 'prefix',
            icon: 'cube',
        },
        {
            title: 'Items Table',
            link: '/items-table',
            pathMatch: 'prefix',
            icon: 'cube',
        },
        {
            title: 'Bays',
            link: '/bays',
            pathMatch: 'prefix',
            icon: 'briefcase',
        },
        {
            title: 'Report Profiles',
            link: '/report-profiles',
            pathMatch: 'prefix',
            icon: 'archive-outline',
        },
        {
            title: 'Report Elements',
            link: '/report-elements',
            pathMatch: 'prefix',
            icon: 'credit-card-outline',
        },
        {
            title: 'Logout',
            link: '/logout',
            icon: 'log-out',
        },
    ];

    destroyed$: Subject<void> = new Subject();
    loggedIn$: Observable<boolean>;
    name$: Observable<string>;

    back$: Observable<any>;
    lastRoute$: Observable<ActivatedRoute>;

    constructor(
        private authService: AuthService,
        public sidebarService: NbSidebarService,
        public menuService: NbMenuService,
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
        this.lastRoute$ = this.router.events.pipe(
            tap((e) => console.log('RouterEvent', e)),
            filter((routerEvent) => routerEvent instanceof NavigationEnd),
            tap(() => console.log('NavigationEnd')),
            map(() => this.activatedRoute.root),
            startWith(this.activatedRoute.root),
            map((node) => {
                while (node.firstChild) {
                    node = node.firstChild;
                }
                return node;
            })
        );
        this.back$ = this.lastRoute$.pipe(
            switchMap((route) => route.data),
            map((data) => data?.back)
        );
    }

    async back() {
        const back = await this.lastRoute$.pipe(take(1)).toPromise();
        const data = await back.data.pipe(take(1)).toPromise();
        if (back && data?.back) {
            this.router.navigate(data.back, { relativeTo: back });
        }
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
