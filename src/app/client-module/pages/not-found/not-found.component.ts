import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    selector: 'depot-not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
    standalone: false
})
export class NotFoundComponent implements OnInit {
    path$: Observable<string>;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        this.path$ = this.route.url.pipe(map(url => '/' + url.join('/')));
    }
}
