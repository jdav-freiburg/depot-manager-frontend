import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap, take, timeout } from 'rxjs/operators';
import {
    AuthUserModel,
    Bay,
    Item,
    ItemInWrite,
    ItemState,
    Picture,
    ReportElement,
    ReportElementInWrite,
    ReportItemInWrite,
    ReportProfile,
    ReportProfileInWrite,
    Reservation,
    ReservationActionInWrite,
    User,
} from '../_models';
import { AuthService } from './auth.service';
import { EnvService } from './env.service';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private http: HttpClient, private env: EnvService, private authService: AuthService) {}

    private authRequest<T>(request: Observable<T>): Observable<T> {
        return this.authService.loggedIn$.pipe(
            filter((x) => x),
            timeout(10),
            take(1),
            switchMap(() => request)
        );
    }

    authByCardId(cardToken: string): Observable<{ token: string; user: AuthUserModel }> {
        return this.http.post<{ token: string; user: AuthUserModel }>(
            `${this.env.apiUrl}/jwt-auth-card`,
            {},
            {
                headers: { Authorization: `Bearer ${cardToken}` },
            }
        );
    }

    getUser(userId: string): Observable<User> {
        return this.authRequest(this.http.get<User>(`${this.env.apiUrl}/users/${userId}`));
        // return this.http.get<UserModel>(`${this.env.oicdIssuer}/profiles/${userId}`, {
        //     headers: { authorization: `Bearer ${this.oauthService.getAccessToken()}` },
        // });
    }

    getUsers(): Observable<User[]> {
        return this.authRequest(this.http.get<User[]>(`${this.env.apiUrl}/users`));
        // return this.http.get<UserModel[]>(`${this.env.oicdIssuer}/profiles`, {
        //     headers: { authorization: `Bearer ${this.oauthService.getAccessToken()}` },
        // });
    }

    getItems(allItems: boolean = false): Observable<Item[]> {
        return this.authRequest(this.http.get<Item[]>(`${this.env.apiUrl}/items${allItems ? '?all=true' : ''}`));
    }

    createItem(item: ReportItemInWrite): Observable<Item> {
        return this.authRequest(this.http.post<Item>(`${this.env.apiUrl}/items`, item));
    }

    getItem(itemId: string): Observable<Item> {
        return this.authRequest(this.http.get<Item>(`${this.env.apiUrl}/items/${itemId}`));
    }

    saveItem(itemId: string, item: ItemInWrite): Observable<Item> {
        return this.authRequest(this.http.put<Item>(`${this.env.apiUrl}/items/${itemId}`, item));
    }

    reportItem(itemId: string, item: ReportItemInWrite): Observable<Item> {
        return this.authRequest(this.http.put<Item>(`${this.env.apiUrl}/items/${itemId}/report`, item));
    }

    getReportElements(): Observable<ReportElement[]> {
        return this.authRequest(this.http.get<ReportElement[]>(`${this.env.apiUrl}/report-elements`));
    }

    createReportElement(element: ReportElementInWrite): Observable<ReportElement> {
        return this.authRequest(this.http.post<ReportElement>(`${this.env.apiUrl}/report-elements`, element));
    }

    getReportElement(id: string): Observable<ReportElement> {
        return this.authRequest(this.http.get<ReportElement>(`${this.env.apiUrl}/report-elements/${id}`));
    }

    saveReportElement(id: string, element: ReportElementInWrite): Observable<ReportElement> {
        return this.authRequest(this.http.put<ReportElement>(`${this.env.apiUrl}/report-elements/${id}`, element));
    }

    deleteReportElement(id: string): Observable<void> {
        return this.authRequest(this.http.delete<void>(`${this.env.apiUrl}/report-elements/${id}`));
    }

    getReportProfiles(): Observable<ReportProfile[]> {
        return this.authRequest(this.http.get<ReportProfile[]>(`${this.env.apiUrl}/report-profiles`));
    }

    createReportProfile(profile: ReportProfileInWrite): Observable<ReportProfile> {
        return this.authRequest(this.http.post<ReportProfile>(`${this.env.apiUrl}/report-profiles`, profile));
    }

    getReportProfile(id: string): Observable<ReportProfile> {
        return this.authRequest(this.http.get<ReportProfile>(`${this.env.apiUrl}/report-profiles/${id}`));
    }

    saveReportProfile(id: string, profile: ReportProfileInWrite): Observable<ReportProfile> {
        return this.authRequest(this.http.put<ReportProfile>(`${this.env.apiUrl}/report-profiles/${id}`, profile));
    }

    deleteReportProfile(id: string): Observable<void> {
        return this.authRequest(this.http.delete<void>(`${this.env.apiUrl}/report-profiles/${id}`));
    }

    getItemHistory(
        itemId: string,
        {
            start,
            end,
            offset,
            limit,
            limitBeforeStart,
            limitAfterEnd,
        }: {
            start?: string;
            end?: string;
            offset?: number;
            limit?: number;
            limitBeforeStart?: number;
            limitAfterEnd?: number;
        }
    ): Observable<ItemState[]> {
        const query = [];
        if (start) {
            query.push('start=' + start);
        }
        if (end) {
            query.push('end=' + end);
        }
        if (offset) {
            query.push('offset=' + offset);
        }
        if (limit) {
            query.push('limit=' + limit);
        }
        if (limitBeforeStart) {
            query.push('limit_before_start=' + limitBeforeStart);
        }
        if (limitAfterEnd) {
            query.push('limit_after_end=' + limitAfterEnd);
        }
        let queryStr = '';
        if (query.length > 0) {
            queryStr = '?' + query.join('&');
        }
        return this.authRequest(this.http.get<ItemState[]>(`${this.env.apiUrl}/items/${itemId}/history${queryStr}`));
    }

    getItemsHistories({
        start,
        end,
        offset,
        limit,
    }: {
        start?: string;
        end?: string;
        offset?: number;
        limit?: number;
    }): Observable<ItemState[]> {
        const query = [];
        if (start) {
            query.push('start=' + start);
        }
        if (end) {
            query.push('end=' + end);
        }
        if (offset) {
            query.push('offset=' + offset);
        }
        if (limit) {
            query.push('limit=' + limit);
        }
        let queryStr = '';
        if (query.length > 0) {
            queryStr = '?' + query.join('&');
        }
        return this.authRequest(this.http.get<ItemState[]>(`${this.env.apiUrl}/items/histories${queryStr}`));
    }

    getReservations({
        includeInactive,
        start,
        end,
        offset,
        limit,
        limitBeforeStart,
        limitAfterEnd,
        includeItems,
    }: {
        includeInactive?: boolean;
        start?: string;
        end?: string;
        offset?: number;
        limit?: number;
        limitBeforeStart?: number;
        limitAfterEnd?: number;
        includeItems?: boolean;
    }): Observable<Reservation[]> {
        const query = [];
        if (start) {
            query.push('start=' + start);
        }
        if (end) {
            query.push('end=' + end);
        }
        if (includeInactive) {
            query.push('include_inactive=true');
        }
        if (offset) {
            query.push('offset=' + offset);
        }
        if (limit) {
            query.push('limit=' + limit);
        }
        if (limitBeforeStart) {
            query.push('limit_before_start=' + limitBeforeStart);
        }
        if (limitAfterEnd) {
            query.push('limit_after_end=' + limitAfterEnd);
        }
        if (includeItems) {
            query.push('include_items=true');
        }
        let queryStr = '';
        if (query.length > 0) {
            queryStr = '?' + query.join('&');
        }
        return this.authRequest(this.http.get<Reservation[]>(`${this.env.apiUrl}/reservations${queryStr}`));
    }

    getReservationItems(start: string, end: string, skipReservationId?: string): Observable<string[]> {
        let query = '?start=' + start + '&end=' + end;
        if (skipReservationId) {
            query += '&skip_reservation_id=' + skipReservationId;
        }
        return this.authRequest(this.http.get<string[]>(`${this.env.apiUrl}/reservations/items${query}`));
    }

    createReservation(reservation: Reservation): Observable<Reservation> {
        return this.authRequest(this.http.post<Reservation>(`${this.env.apiUrl}/reservations`, reservation));
    }

    getReservation(reservationId: string): Observable<Reservation> {
        return this.authRequest(this.http.get<Reservation>(`${this.env.apiUrl}/reservations/${reservationId}`));
    }

    saveReservation(reservationId: string, reservation: Reservation): Observable<Reservation> {
        return this.authRequest(
            this.http.put<Reservation>(`${this.env.apiUrl}/reservations/${reservationId}`, reservation)
        );
    }

    deleteReservation(reservationId: string): Observable<Reservation> {
        return this.authRequest(this.http.delete<Reservation>(`${this.env.apiUrl}/reservations/${reservationId}`));
    }

    reservationAction(reservationId: string, action: ReservationActionInWrite): Observable<void> {
        return this.authRequest(this.http.put<void>(`${this.env.apiUrl}/reservations/${reservationId}/action`, action));
    }

    getPictures(): Observable<Picture[]> {
        return this.authRequest(this.http.get<Picture[]>(`${this.env.apiUrl}/pictures`));
    }

    createPicture(data: Blob): Observable<string> {
        const formData = new FormData();
        formData.append('file', data);
        return this.authRequest(this.http.post<string>(`${this.env.apiUrl}/pictures`, formData));
    }

    getPictureUrl(pictureId: string): string {
        return `${this.env.apiUrl}/pictures/${pictureId}`;
    }

    getPicturePreviewUrl(pictureId: string): string {
        return `${this.env.apiUrl}/pictures/${pictureId}/preview`;
    }
}
