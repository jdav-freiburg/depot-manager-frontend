import { Component, AfterViewInit } from '@angular/core';
import { AuthService } from 'src/app/common-module/_services';

@Component({
    templateUrl: './logout.component.html',
    styleUrls: ['./logout.component.scss'],
    standalone: false
})
export class LogoutComponent implements AfterViewInit {
    constructor(private auth: AuthService) {}

    ngAfterViewInit() {
        this.auth.logout();
    }
}
