import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent implements OnInit {
    path$: Observable<string>;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.path$ = this.route.url.pipe(map((url) => '/' + url.join('/')));
    }
}
