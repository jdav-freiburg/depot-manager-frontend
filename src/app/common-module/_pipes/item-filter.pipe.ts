import { Pipe, PipeTransform } from '@angular/core';
import { Item, ReservationItem } from '../_models';

export interface Filterable extends Item {
    filterLookup: string;
}

@Pipe({
    name: 'itemFilter',
    standalone: false
})
export class ItemFilterPipe implements PipeTransform {
    transform<ItemType extends Filterable>(
        items: ItemType[] | null | undefined,
        filter: { filter?: string; onlyShowIds?: ReservationItem[] }
    ): ItemType[] {
        let result = items ?? [];

        if (filter?.onlyShowIds) {
            const idsByKey = filter.onlyShowIds.reduce((o, i) => {
                o[i.itemId] = true;
                return o;
            }, Object.create(null));
            result = result.filter((item) => idsByKey[item.id]);
        }
        if (filter?.filter) {
            const filters = filter.filter
                .toLowerCase()
                .split(' ')
                .map((f) => f.trim())
                .filter((f) => !!f);
            result = result.filter((item) => filters.every((f) => item.filterLookup.includes(f)));
        }
        return result;
    }
}
