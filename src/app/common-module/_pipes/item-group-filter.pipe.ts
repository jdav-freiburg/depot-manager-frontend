import { Pipe, PipeTransform } from '@angular/core';
import { ReservationItem } from '../_models';
import { Filterable } from './item-filter.pipe';

@Pipe({
    name: 'itemGroupFilter',
    standalone: false
})
export class ItemGroupFilterPipe implements PipeTransform {
    transform<ItemType extends Filterable>(
        items: ItemType[][] | null | undefined,
        filter: { filter?: string; onlyShowIds?: ReservationItem[] }
    ): ItemType[][] {
        let result = items ?? [];

        if (filter?.filter) {
            const filters = filter.filter
                .toLowerCase()
                .split(' ')
                .map((f) => f.trim())
                .filter((f) => !!f);
            result = result.filter((item) => filters.every((f) => item[0].filterLookup.includes(f)));
        }
        if (filter?.onlyShowIds) {
            const idsByKey = filter.onlyShowIds.reduce((o, i) => {
                o[i.itemId] = true;
                return o;
            }, Object.create(null));
            result = result.filter((item) => item.some((ite) => idsByKey[ite.id]));
        }
        return result;
    }
}
