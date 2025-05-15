import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../_services';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ReportElement } from '../_models';

@Pipe({
    name: 'reportElement',
    standalone: false
})
export class ReportElementPipe implements PipeTransform {
    constructor(private reportService: ReportService) {}

    transform(value: string): Observable<ReportElement> {
        if (!value) {
            return null;
        }
        return this.reportService.elementsById$.pipe(
            map((elementsById) => elementsById[value]),
            filter((element) => !!element)
        );
    }
}
