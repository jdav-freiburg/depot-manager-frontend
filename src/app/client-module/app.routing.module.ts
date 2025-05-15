import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthenticationComponent } from './pages/authentication/authentication.component';
import { BayComponent } from './pages/bay/bay.component';
import { BaysComponent } from './pages/bays/bays.component';
import { ItemComponent } from './pages/item/item.component';
import { ItemsTableComponent } from './pages/items-table/items-table.component';
import { ItemsComponent } from './pages/items/items.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PagesComponent } from './pages/pages.component';
import { ReportElementComponent } from './pages/report-element/report-element.component';
import { ReportElementsComponent } from './pages/report-elements/report-elements.component';
import { ReportProfileComponent } from './pages/report-profile/report-profile.component';
import { ReportProfilesComponent } from './pages/report-profiles/report-profiles.component';
import { ReservationReturnComponent } from './pages/reservation-return/reservation-return.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';

const routes: Routes = [
    {
        path: '',
        component: PagesComponent,
        children: [
            {
                path: '',
                component: AuthenticationComponent,
            },
            {
                path: 'reservations',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: ReservationsComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':reservationId',
                        component: ReservationComponent,
                        data: { back: ['..'] },
                    },
                    {
                        path: ':reservationId/return',
                        component: ReservationReturnComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'items',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: ItemsComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':itemId',
                        component: ItemComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'items-table',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: ItemsTableComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':itemId',
                        component: ItemComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'bays',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: BaysComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':bayId',
                        component: BayComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'report-profiles',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: ReportProfilesComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':reportProfileId',
                        component: ReportProfileComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'report-elements',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: ReportElementsComponent,
                        data: { reuseRoute: true },
                    },
                    {
                        path: ':reportElementId',
                        component: ReportElementComponent,
                        data: { back: ['..'] },
                    },
                ],
            },
            {
                path: 'logout',
                component: LogoutComponent,
            },

            // otherwise redirect to home
            {
                path: '**',
                component: NotFoundComponent,
                // redirectTo: ''
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
