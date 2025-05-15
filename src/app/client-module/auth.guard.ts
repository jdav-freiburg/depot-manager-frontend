import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../common-module/_services';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
    constructor(private router: Router, private authService: AuthService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.authService.loggedIn$.pipe(
            map((loggedIn) => {
                if (!loggedIn) {
                    this.router.navigate(['/'], { queryParams: { returnUrl: state.url } });
                    return false;
                }
                return true;
            })
        );
    }
}
