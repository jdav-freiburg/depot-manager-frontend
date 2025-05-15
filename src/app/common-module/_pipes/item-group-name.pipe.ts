import { Pipe, PipeTransform } from '@angular/core';
import { ItemsService } from '../_services';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Pipe({
    name: 'itemGroupName',
    standalone: false
})
export class ItemGroupNamePipe implements PipeTransform {
    constructor(private itemsService: ItemsService) {}
    transform(value: string): Observable<string> {
        if (!value) {
            return null;
        }
        return this.itemsService.itemsByGroupId$.pipe(
            map((itemsByGroupId) => itemsByGroupId[value]),
            filter((items) => !!items?.length),
            map((items) => items[0].name)
        );
    }
}
