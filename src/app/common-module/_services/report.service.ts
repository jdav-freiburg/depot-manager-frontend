import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { multicast, refCount, switchMap, map } from 'rxjs/operators';
import { ReplaySubject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { ReportProfile, ReportElement } from '../_models';
import { UpdateService } from './update.service';

export class ReportProfileWithElements {
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;

    constructor(profile: ReportProfile, public readonly elements: ReportElement[]) {
        this.id = profile.id;
        this.name = profile.name;
        this.description = profile.description;
    }
}

@Injectable({
    providedIn: 'root',
})
export class ReportService {
    public readonly profilesById$: Observable<Record<string, ReportProfile>>;
    public readonly profiles$: Observable<ReportProfile[]>;
    public readonly elementsById$: Observable<Record<string, ReportElement>>;
    public readonly elements$: Observable<ReportElement[]>;

    public readonly profilesWithElements$: Observable<ReportProfileWithElements[]>;
    public readonly profilesByIdWithElements$: Observable<Record<string, ReportProfileWithElements>>;

    constructor(api: ApiService, private updateService: UpdateService) {
        this.profiles$ = updateService.updateReportProfiles$.pipe(
            switchMap(() => api.getReportProfiles()),
            multicast(() => new ReplaySubject<ReportProfile[]>(1)),
            refCount()
        );
        this.elements$ = updateService.updateReportElements$.pipe(
            switchMap(() => api.getReportElements()),
            multicast(() => new ReplaySubject<ReportElement[]>(1)),
            refCount()
        );
        this.profilesById$ = this.profiles$.pipe(
            map((profiles) =>
                profiles.reduce((o, el) => {
                    o[el.id] = el;
                    return o;
                }, Object.create(null) as Record<string, ReportProfile>)
            ),
            multicast(() => new ReplaySubject<Record<string, ReportProfile>>(1)),
            refCount()
        );
        this.elementsById$ = this.elements$.pipe(
            map((elements) =>
                elements.reduce((o, el) => {
                    o[el.id] = el;
                    return o;
                }, Object.create(null) as Record<string, ReportElement>)
            ),
            multicast(() => new ReplaySubject<Record<string, ReportElement>>(1)),
            refCount()
        );
        this.profilesWithElements$ = combineLatest([this.profiles$, this.elementsById$]).pipe(
            map(([profiles, elementsById]) => {
                return profiles.map(
                    (profile) =>
                        new ReportProfileWithElements(
                            profile,
                            profile.elements.map((el) => elementsById[el]).filter((x) => !!x)
                        )
                );
            })
        );
        this.profilesByIdWithElements$ = this.profilesWithElements$.pipe(
            map((profiles) =>
                profiles.reduce((o, el) => {
                    o[el.id] = el;
                    return o;
                }, Object.create(null) as Record<string, ReportProfileWithElements>)
            ),
            multicast(() => new ReplaySubject<Record<string, ReportProfileWithElements>>(1)),
            refCount()
        );
    }

    reload() {
        this.updateService.updateReportProfiles$.next();
        this.updateService.updateReportElements$.next();
    }
}
