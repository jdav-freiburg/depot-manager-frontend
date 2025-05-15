import { Pipe, PipeTransform } from '@angular/core';
import { ReportProfileWithElements, ReportService } from '../_services';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Pipe({
    name: 'reportProfile',
    standalone: false
})
export class ReportProfilePipe implements PipeTransform {
    constructor(private reportService: ReportService) {}

    transform(value: string): Observable<ReportProfileWithElements> {
        if (!value) {
            return null;
        }
        return this.reportService.profilesByIdWithElements$.pipe(
            map((profilesById) => profilesById[value]),
            filter((element) => !!element)
        );
    }
}
