import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { NbSidebarModule, NbSidebarService, NbThemeModule, NbToastrService } from '@nebular/theme';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './client-module/app.routing.module';
import { ClientModuleModule } from './client-module/client-module.module';
import { AuthService, EnvService } from './common-module/_services';
import { AuthMockService } from './common-module/_services/auth-mock.service';
import { ReservationResolver } from './device-module/_services/reservation.resolver';

@NgModule({
    // entryComponents: [CalendarRangeDayCellComponent, CalendarRangeComponent],
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [BrowserModule,
        BrowserAnimationsModule,
        NbThemeModule.forRoot(),
        ClientModuleModule,
        AppRoutingModule,
        NbSidebarModule],
    providers: [
        NbSidebarService,
        {
            provide: APP_BASE_HREF,
            useValue: '/'
        },
        ReservationResolver,
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: AuthService,
            useFactory: (oAuth: OAuthService, envService: EnvService, router: Router, toastService: NbToastrService) => {
                if (environment.offline) {
                    return new AuthMockService(router);
                } else {
                    return new AuthService(oAuth, envService, router, toastService);
                }
            },
            deps: [OAuthService, EnvService, Router, NbToastrService]
        },
    ]
})
export class AppModule {
}
