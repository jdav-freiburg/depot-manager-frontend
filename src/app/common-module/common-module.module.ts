import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
    NbAccordionModule,
    NbActionsModule,
    NbAlertModule,
    NbBaseCalendarModule,
    NbButtonModule,
    NbCalendarKitModule,
    NbCalendarModule,
    NbCalendarRangeModule,
    NbCardModule,
    NbChatModule,
    NbCheckboxModule,
    NbContextMenuModule,
    NbDatepickerModule,
    NbDialogModule,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbListModule,
    NbMenuModule,
    NbPopoverModule,
    NbProgressBarModule,
    NbRadioModule,
    NbRouteTabsetModule,
    NbSearchModule,
    NbSelectModule,
    NbSpinnerModule,
    NbStepperModule,
    NbTabsetModule,
    NbThemeModule,
    NbToastrModule,
    NbTooltipModule,
    NbTreeGridModule,
    NbUserModule,
    NbWindowModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';

import { TagInputModule } from 'ngx-chips';
import { NgxFileDropModule } from 'ngx-file-drop';

import {
    CalendarRangeComponent,
    CalendarRangeDayCellComponent,
    DateRangePickerComponent,
} from './components/date-range-picker/date-range-picker.component';

import { FormElementComponent } from './components/form-element/form-element.component';
import { ReservationItemsComponent } from './components/reservation-items/reservation-items.component';
import {
    ItemFilterPipe,
    ItemGroupFilterPipe,
    FormatDateTimePipe,
    FormatDatePipe,
    ReportElementPipe,
    ItemGroupNamePipe,
    BayNamePipe,
    ReportProfilePipe,
    ItemNamePipe,
    ReservationNamePipe,
} from './_pipes';
import { PictureListComponent } from './components/picture-list/picture-list.component';
import { ItemDetailsComponent } from './components/item-details/item-details.component';
import { ItemGroupListComponent } from './components/item-group-list/item-group-list.component';
import { BayListComponent } from './components/bay-list/bay-list.component';
import { ItemBaysComponent } from './components/item-bays/item-bays.component';
import { OAuthModule } from 'angular-oauth2-oidc';
import { getApiUrl } from './_services';
import { ReportElementListComponent } from './components/report-element-list/report-element-list.component';
import { ReportProfileListComponent } from './components/report-profile-list/report-profile-list.component';
import { ReservationItemsTableComponent } from './components/reservation-items-table/reservation-items-table.component';
import { ReservationDetailsComponent } from './components/reservation-details/reservation-details.component';
import { UserNamePipe } from './_pipes/user-name.pipe';
import { ReservationListItemComponent } from './components/reservation-list-item/reservation-list-item.component';
import { MarkdownModule } from 'ngx-markdown';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ItemDetailsHistoryComponent } from './components/item-details-history/item-details-history.component';

@NgModule({
    entryComponents: [CalendarRangeDayCellComponent, CalendarRangeComponent],
    declarations: [
        FormElementComponent,
        ReservationItemsComponent,
        ReservationItemsTableComponent,
        ReservationDetailsComponent,
        ReservationListItemComponent,
        ItemBaysComponent,

        CalendarRangeDayCellComponent,
        CalendarRangeComponent,
        DateRangePickerComponent,
        ItemDetailsHistoryComponent,

        ItemFilterPipe,
        ItemGroupFilterPipe,
        BayNamePipe,
        FormatDatePipe,
        FormatDateTimePipe,
        BayListComponent,
        PictureListComponent,
        ItemDetailsComponent,
        ItemGroupListComponent,
        ItemGroupNamePipe,
        ReportElementListComponent,
        ReportProfileListComponent,
        ConfirmDialogComponent,
        ReportElementPipe,
        ReportProfilePipe,
        ReservationNamePipe,
        UserNamePipe,
        ItemNamePipe,
    ],
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        NbThemeModule.forRoot(),
        NbMenuModule.forRoot(),
        NbToastrModule.forRoot(),
        NbDialogModule.forRoot(),
        NbDatepickerModule.forRoot(),
        NbActionsModule,
        NbCardModule,
        NbLayoutModule,
        NbRouteTabsetModule,
        NbSearchModule,
        NbTabsetModule,
        NbUserModule,
        NbCheckboxModule,
        NbPopoverModule,
        NbContextMenuModule,
        NbProgressBarModule,
        NbCalendarModule,
        NbCalendarRangeModule,
        NbStepperModule,
        NbButtonModule,
        NbInputModule,
        NbAccordionModule,
        NbWindowModule,
        NbListModule,
        NbAlertModule,
        NbSpinnerModule,
        NbRadioModule,
        NbSelectModule,
        NbChatModule,
        NbTooltipModule,
        NbCalendarKitModule,
        NbEvaIconsModule,
        NbBaseCalendarModule,
        NbIconModule,
        NbTreeGridModule,
        TagInputModule,
        NgxFileDropModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        MarkdownModule.forRoot(),
        OAuthModule.forRoot({
            resourceServer: {
                customUrlValidation: (url) => url.startsWith(getApiUrl()),
                sendAccessToken: true,
            },
        }),
    ],
    exports: [
        FormElementComponent,
        ReservationItemsComponent,
        ReservationItemsTableComponent,
        ReservationListItemComponent,
        ReservationDetailsComponent,
        ItemBaysComponent,

        CalendarRangeDayCellComponent,
        CalendarRangeComponent,
        DateRangePickerComponent,

        ReportElementListComponent,
        ConfirmDialogComponent,

        ItemFilterPipe,
        ItemGroupFilterPipe,
        BayNamePipe,
        FormatDatePipe,
        FormatDateTimePipe,
        BayListComponent,
        PictureListComponent,
        ItemDetailsComponent,
        ItemGroupListComponent,
        ItemGroupNamePipe,
        ReportElementPipe,
        ReportProfilePipe,
        ReservationNamePipe,
        ItemNamePipe,
    ],
})
export class CommonModuleModule {}
