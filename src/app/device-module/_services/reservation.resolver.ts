import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Reservation } from 'src/app/common-module/_models';
import { ApiService } from 'src/app/common-module/_services';
import { Observable } from 'rxjs';

@Injectable()
export class ReservationResolver  {
    public constructor(private api: ApiService) {}

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Reservation> {
        return this.api.getReservation(route.paramMap.get('reservationId'));
    }
}
