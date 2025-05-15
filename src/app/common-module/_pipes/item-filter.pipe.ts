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
        items: ItemType[],
        filter: { filter?: string; onlyShowIds?: ReservationItem[] }
    ): ItemType[] {
        if (filter?.onlyShowIds) {
            const idsByKey = filter.onlyShowIds.reduce((o, i) => {
                o[i.itemId] = true;
                return o;
            }, Object.create(null));
            items = items.filter((item) => idsByKey[item.id]);
        }
        if (filter?.filter) {
            const filters = filter.filter
                .toLowerCase()
                .split(' ')
                .map((f) => f.trim())
                .filter((f) => !!f);
            items = items.filter((item) => filters.every((f) => item.filterLookup.includes(f)));
        }
        return items;
    }
}
