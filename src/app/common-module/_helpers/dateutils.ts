export function toIsoDate(date: Date): string {
    if (date === undefined || date === null) {
        return null;
    }
    if (!(date instanceof Date)) {
        throw Error('Expected Date');
    }
    const y = (date.getFullYear() + '').padStart(4, '0');
    const m = (date.getMonth() + 1 + '').padStart(2, '0');
    const d = (date.getDate() + '').padStart(2, '0');
    return y + '-' + m + '-' + d;
}

export function fromIsoDate(date: string): Date {
    if (date === undefined || date === null) {
        return null;
    }
    if (!(typeof date === 'string')) {
        throw Error('Expected string');
    }
    const ymd = date.split('-');
    if (ymd.length !== 3) {
        throw Error('Invalid format');
    }
    return new Date(date + 'T00:00:00.000Z');
}

export function fromIsoDateTime(dateTime: string): Date {
    if (dateTime === undefined || dateTime === null) {
        return null;
    }
    if (!(typeof dateTime === 'string')) {
        throw Error('Expected string');
    }
    if (!dateTime.endsWith('Z')) {
        dateTime += 'Z';
    }
    return new Date(dateTime);
}

export function toIsoDateTime(dateTime: Date): string {
    if (dateTime === undefined || dateTime === null) {
        return null;
    }
    if (!(dateTime instanceof Date)) {
        throw Error('Expected Date');
    }
    return dateTime.toISOString();
}

export interface ValueAccessor {
    getValue(): string;

    setValue(val: string);
}

export class DateHelper {
    private _storedDateValue: Date = null;

    constructor(private valueAccessor: ValueAccessor) {}

    get dateValue(): Date {
        const parsedValue = fromIsoDate(this.valueAccessor.getValue());
        if (
            parsedValue &&
            this._storedDateValue &&
            this._storedDateValue.getFullYear() === parsedValue.getFullYear() &&
            this._storedDateValue.getMonth() === parsedValue.getMonth() &&
            this._storedDateValue.getDate() === parsedValue.getDate()
        ) {
            return this._storedDateValue;
        }
        this._storedDateValue = parsedValue;
        return parsedValue;
    }

    set dateValue(val: Date) {
        this._storedDateValue = val;
        this.valueAccessor.setValue(toIsoDate(val));
    }
}
