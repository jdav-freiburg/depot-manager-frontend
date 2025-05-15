import { Pipe, PipeTransform } from '@angular/core';
import { ItemsService } from '../_services';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Pipe({
    name: 'bayName',
    standalone: false
})
export class BayNamePipe implements PipeTransform {
    constructor(private itemsService: ItemsService) {}
    transform(value: string): Observable<string> {
        if (!value) {
            return null;
        }
        return this.itemsService.baysById$.pipe(
            map((baysById) => baysById[value]),
            filter((bay) => !!bay),
            map((bay) => bay.name)
        );
    }
}
