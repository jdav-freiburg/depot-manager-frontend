import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { multicast, refCount, switchMap, map } from 'rxjs/operators';
import { ReplaySubject, Observable } from 'rxjs';
import { Item, Bay } from '../_models';
import { UpdateService } from './update.service';

@Injectable({
    providedIn: 'root',
})
export class ItemsService {
    public readonly itemsById$: Observable<Record<string, Item>>;
    public readonly items$: Observable<Item[]>;
    public readonly itemsByGroupId$: Observable<Record<string, Item[]>>;
    public readonly itemTags$: Observable<string[]>;

    constructor(api: ApiService, private updateService: UpdateService) {
        this.items$ = updateService.updateItems$.pipe(
            switchMap(() => api.getItems()),
            // Here we set the UI only `isGroup` attribute based on internal contract.
            // (first item in list with `groupId` is a group, everything else is not)
            map(items => {
                const seenGroupIds = new Set<string>();
                return items.map(item => {
                    if (!item.groupId) {
                        return item;
                    }
                    const isGroup = !seenGroupIds.has(item.groupId);
                    seenGroupIds.add(item.groupId);
                    return <Item>{ ...item, isGroup };
                });
            }),
            multicast(() => new ReplaySubject<Item[]>(1)),
            refCount()
        );
        this.itemsById$ = this.items$.pipe(
            map((items) =>
                items.reduce((o, el) => {
                    o[el.id] = el;
                    return o;
                }, Object.create(null) as Record<string, Item>)
            ),
            multicast(() => new ReplaySubject<Record<string, Item>>(1)),
            refCount()
        );
        this.itemsByGroupId$ = this.items$.pipe(
            map((items) =>
                items.reduce((o, el) => {
                    if (el.groupId != null) {
                        if (Object.hasOwnProperty.call(o, el.groupId)) {
                            o[el.groupId].push(el);
                        } else {
                            o[el.groupId] = [el];
                        }
                    }
                    return o;
                }, Object.create(null) as Record<string, Item[]>)
            ),
            multicast(() => new ReplaySubject<Record<string, Item[]>>(1)),
            refCount()
        );
        this.itemTags$ = this.items$.pipe(
            map((items) => [...new Set([].concat(...items.map((item) => item.tags)))].sort()),
            multicast(() => new ReplaySubject<string[]>(1)),
            refCount()
        );
    }

    reload() {
        this.updateService.updateItems$.next();
    }
}
