import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UpdateService {
    updateReservations$ = new BehaviorSubject<void>(undefined);
    updateItems$ = new BehaviorSubject<void>(undefined);
    updateReportElements$ = new BehaviorSubject<void>(undefined);
    updateReportProfiles$ = new BehaviorSubject<void>(undefined);
    updateBays$ = new BehaviorSubject<void>(undefined);
    updateUsers$ = new BehaviorSubject<void>(undefined);
}
