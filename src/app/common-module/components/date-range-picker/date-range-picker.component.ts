import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output,
    Type,
    HostListener,
} from '@angular/core';
import {
    NbCalendarCell,
    NbCalendarComponent,
    NbCalendarMonthCellComponent,
    NbCalendarRange,
    NbCalendarRangeYearCellComponent,
    NbCalendarSize,
    NbCalendarViewMode,
    NbDatepickerComponent,
    NbDateService,
} from '@nebular/theme';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface NbCalendarRangeWithStartEnd<D> extends NbCalendarRange<D> {
    selectingStart: boolean;
}

@Component({
    selector: 'depot-calendar-range-day-cell',
    template: `
        <div class="cell-content">
            {{ day }}
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CalendarRangeDayCellComponent<D> implements NbCalendarCell<D, NbCalendarRangeWithStartEnd<D>> {
    @Input() date: D;

    @Input() selectedValue: NbCalendarRangeWithStartEnd<D>;

    @Input() visibleDate: D;

    @Input() min: D;

    @Input() max: D;

    @Input() filter: (D) => boolean;

    @Output() select: EventEmitter<D> = new EventEmitter(true); // tslint:disable-line

    constructor(protected dateService: NbDateService<D>) {}

    @HostBinding('class.in-range') get inRange(): boolean {
        return (
            this.date &&
            this.selectedValue &&
            this.selectedValue.start &&
            (this.dateService.compareDates(this.date, this.selectedValue.start) >= 0 ||
                this.dateService.isSameDay(this.date, this.selectedValue.start)) &&
            this.selectedValue.end &&
            (this.dateService.compareDates(this.date, this.selectedValue.end) <= 0 ||
                this.dateService.isSameDay(this.date, this.selectedValue.end))
        );
    }

    @HostBinding('class.start') get start(): boolean {
        return (
            this.date &&
            this.selectedValue &&
            this.selectedValue.start &&
            this.dateService.isSameDay(this.date, this.selectedValue.start)
        );
    }

    @HostBinding('class.end') get end(): boolean {
        return (
            this.date &&
            this.selectedValue &&
            this.selectedValue.end &&
            this.dateService.isSameDay(this.date, this.selectedValue.end)
        );
    }

    @HostBinding('class.range-cell')
    rangeCellClass = true;

    @HostBinding('class.day-cell')
    dayCellClass = true;

    @HostBinding('class.today')
    get today(): boolean {
        return this.date && this.dateService.isSameDay(this.date, this.dateService.today());
    }

    get boundingMonth(): boolean {
        return !this.dateService.isSameMonthSafe(this.date, this.visibleDate);
    }

    @HostBinding('class.selected')
    get selected(): boolean {
        if (this.inRange) {
            return true;
        }

        return (
            this.date &&
            this.selectedValue &&
            ((this.selectedValue.selectingStart &&
                this.selectedValue.start &&
                this.dateService.isSameDay(this.date, this.selectedValue.start)) ||
                (!this.selectedValue.selectingStart &&
                    this.selectedValue.end &&
                    this.dateService.isSameDay(this.date, this.selectedValue.end)))
        );
    }

    get empty(): boolean {
        return !this.date;
    }

    @HostBinding('class.disabled')
    get disabled(): boolean {
        return this.smallerThanMin() || this.greaterThanMax() || this.dontFitFilter();
    }

    get day(): number {
        return this.date && this.dateService.getDate(this.date);
    }

    @HostListener('click')
    onClick() {
        if (this.disabled || this.empty) {
            return;
        }

        this.select.emit(this.date);
    }

    private smallerThanMin(): boolean {
        return (
            this.date &&
            this.min &&
            this.dateService.compareDates(this.date, this.min) < 0 &&
            !this.dateService.isSameDay(this.date, this.min)
        );
    }

    private greaterThanMax(): boolean {
        return (
            this.date &&
            this.max &&
            this.dateService.compareDates(this.date, this.max) > 0 &&
            !this.dateService.isSameDay(this.date, this.max)
        );
    }

    private dontFitFilter(): boolean {
        return this.date && this.filter && !this.filter(this.date);
    }
}

@Component({
    selector: 'depot-calendar-range',
    template: `
        <nb-base-calendar
            [date]="range"
            (dateChange)="onChange($event)"
            [min]="min"
            [max]="max"
            [filter]="filter"
            [startView]="startView"
            [boundingMonth]="boundingMonth"
            [dayCellComponent]="dayCellComponent"
            [monthCellComponent]="monthCellComponent"
            [yearCellComponent]="yearCellComponent"
            [visibleDate]="visibleDate"
            [showNavigation]="showNavigation"
            [size]="size"
        ></nb-base-calendar>
    `,
    standalone: false
})
export class CalendarRangeComponent<D> {
    /**
     * Defines if we should render previous and next months
     * in the current month view.
     */
    @Input() boundingMonth = true;

    /**
     * Defines starting view for the calendar.
     */
    @Input() startView: NbCalendarViewMode = NbCalendarViewMode.DATE;

    /**
     * A minimum available date for selection.
     */
    @Input() min: D;

    /**
     * A maximum available date for selection.
     */
    @Input() max: D;

    /**
     * A predicate that decides which cells will be disabled.
     */
    @Input() filter: (D) => boolean;
    dayCellComponent: Type<NbCalendarCell<D, NbCalendarRangeWithStartEnd<D>>> = CalendarRangeDayCellComponent;
    /**
     * Custom month cell component. Have to implement `NbCalendarCell` interface.
     */
    @Input() monthCellComponent: Type<NbCalendarCell<D, NbCalendarRangeWithStartEnd<D>>> = null;
    yearCellComponent: Type<NbCalendarCell<D, NbCalendarRange<D>>> = NbCalendarRangeYearCellComponent;
    /**
     * Size of the calendar and entire components.
     * Can be 'medium' which is default or 'large'.
     */
    @Input() size: NbCalendarSize = NbCalendarSize.MEDIUM;
    @Input() visibleDate: D;
    /**
     * Determines should we show calendars header or not.
     */
    @Input() showNavigation = true;
    /**
     * Range which will be rendered as selected.
     */
    @Input() range: NbCalendarRangeWithStartEnd<D>;
    /**
     * Emits range when start selected and emits again when end selected.
     */
    @Output() rangeChange: EventEmitter<NbCalendarRangeWithStartEnd<D>> = new EventEmitter();

    constructor(protected dateService: NbDateService<D>) {}

    /**
     * Custom day cell component. Have to implement `NbCalendarCell` interface.
     */
    @Input('dayCellComponent')
    set _cellComponent(cellComponent: Type<NbCalendarCell<D, NbCalendarRangeWithStartEnd<D>>>) {
        if (cellComponent) {
            this.dayCellComponent = cellComponent;
        }
    }

    /**
     * Custom year cell component. Have to implement `NbCalendarCell` interface.
     */
    @Input('yearCellComponent')
    set _yearCellComponent(cellComponent: Type<NbCalendarCell<D, NbCalendarRangeWithStartEnd<D>>>) {
        if (cellComponent) {
            this.yearCellComponent = cellComponent;
        }
    }

    onChange(date: D) {
        if (this.range) {
            this.range = {
                start: this.range.selectingStart ? date : this.range.start,
                end: this.range.selectingStart ? this.range.end : date,
                selectingStart: this.range.selectingStart,
            };
            this.rangeChange.emit(this.range);
        }
    }
}

@Component({
    selector: 'depot-date-range-picker',
    template: '',
    standalone: false
})
export class DateRangePickerComponent<D> extends NbDatepickerComponent<D> {
    @Input() selectingStart: boolean;
    @Input() otherDate: D;

    protected pickerClass: Type<NbCalendarComponent<D>> = <Type<NbCalendarComponent<D>>>(
        (<unknown>CalendarRangeComponent) // tslint:disable-line
    );

    get value(): D | undefined {
        return this.picker && this.picker.range
            ? this.selectingStart
                ? this.picker.range.start
                : this.picker.range.end
            : undefined;
    }

    set value(value: D) {
        if (!this.picker) {
            this.queue = value;
            return;
        }

        this.visibleDate = value;
        this.picker.visibleDate = value;
        this.picker.range = {
            start: this.selectingStart ? value : this.otherDate,
            end: this.selectingStart ? this.otherDate : value,
            selectingStart: this.selectingStart,
        };
    }

    protected get pickerValueChange(): Observable<D> {
        return this.picker.rangeChange.pipe(
            map((range: NbCalendarRangeWithStartEnd<D>) => (this.selectingStart ? range.start : range.end))
        );
    }

    protected patchWithInputs(): void {
        super.patchWithInputs();
        this.picker.range = {
            start: this.selectingStart ? this.value : this.otherDate,
            end: this.selectingStart ? this.otherDate : this.value,
            selectingStart: this.selectingStart,
        };
    }

    protected writeQueue() {
        if (this.queue) {
            const value = this.queue;
            this.queue = null;
            this.value = value;
        }
    }
}
