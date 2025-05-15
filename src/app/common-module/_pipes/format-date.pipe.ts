import { Pipe, PipeTransform } from '@angular/core';
import { fromIsoDate, fromIsoDateTime } from '../_helpers';

@Pipe({
    name: 'formatDate',
    standalone: false
})
export class FormatDatePipe implements PipeTransform {
    transform(date: string): string {
        if (!date) {
            return '';
        }
        return fromIsoDate(date).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

@Pipe({
    name: 'formatDateTime',
    standalone: false
})
export class FormatDateTimePipe implements PipeTransform {
    transform(date: string): string {
        if (!date) {
            return '';
        }
        return fromIsoDateTime(date).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}
