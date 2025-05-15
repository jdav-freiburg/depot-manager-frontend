import { Pipe, PipeTransform } from '@angular/core';
import { fromIsoDate, fromIsoDateTime } from '../_helpers';

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY; // approx
const SECONDS_IN_YEAR = 365 * SECONDS_IN_DAY; // approx

@Pipe({ name: 'dateDuration' })
export class DateDurationPipe implements PipeTransform {
    transform(date: string): string {
        if (!date) {
            return '';
        }

        const seconds = (Date.now() - fromIsoDate(date).getTime()) / 1000;
        const formatter = new Intl.NumberFormat('de-DE', { compactDisplay: 'short' });


        if (seconds >= SECONDS_IN_MONTH) {
            let _seconds = seconds;
            const parts = [];

            const years = Math.floor(seconds / SECONDS_IN_YEAR);
            if (years > 0) {
                parts.push(`${years}J`);
                _seconds -= years * SECONDS_IN_YEAR;
            }

            const months = Math.floor(_seconds / SECONDS_IN_MONTH);
            if (months > 0) {
                parts.push(`${months}M`);
            }

            return parts.join(' ')
        }

        if (seconds >= SECONDS_IN_WEEK) {
            const weeks = seconds / SECONDS_IN_WEEK;
            return `${formatter.format(+weeks.toFixed(1))}W`;
        }
        if (seconds >= SECONDS_IN_DAY) {
            const days = seconds / SECONDS_IN_DAY;
            return `${formatter.format(+days.toFixed(1))}T`;
        }
        if (seconds >= SECONDS_IN_HOUR) {
            const hours = seconds / SECONDS_IN_HOUR;
            return `${formatter.format(+hours.toFixed(1))}H`;
        }
        if (seconds >= SECONDS_IN_MINUTE) {
            const minutes = seconds / SECONDS_IN_MINUTE;
            return `${formatter.format(+minutes.toFixed(1))}Min`;
        }

        return `${formatter.format(+seconds.toFixed(1))}Sec`;
    }
}
