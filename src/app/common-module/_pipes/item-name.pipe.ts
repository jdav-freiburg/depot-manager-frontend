import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemsService } from '../_services';

@Pipe({
    name: 'itemName',
    standalone: false
})
export class ItemNamePipe implements PipeTransform {
    constructor(private itemsService: ItemsService) {}

    transform(value: string): Observable<string> {
        if (!value) {
            return null;
        }
        return this.itemsService.itemsById$.pipe(
            map((itemsById) => itemsById[value]),
            map((item) => (item ? `${item.name} (${item.externalId})` : null))
        );
    }
}
