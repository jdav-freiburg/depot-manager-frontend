import {
    Component,
    ContentChild,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { DateHelper } from '../../_helpers';
import { NbDialogService } from '@nebular/theme';
import { ApiService, ItemsService } from '../../_services';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Choice<T> {
    value: T;
    title: string;
    disabled?: boolean;
    status?: string;
}

@Component({
    selector: 'depot-form-element',
    templateUrl: './form-element.component.html',
    styleUrls: ['./form-element.component.scss'],
    standalone: false
})
export class FormElementComponent {
    @Input() formControlRef: UntypedFormControl;
    @Input() formControlRefEnd: UntypedFormControl;

    @Input() type:
        | 'text'
        | 'textarea'
        | 'markdown'
        | 'checkbox'
        | 'date'
        | 'daterange'
        | 'radio'
        | 'select'
        | 'tags'
        | 'bay'
        | 'reportProfile'
        | 'reportState'
        | 'reportFinalState'
        | 'itemgroup' = 'text';
    @Input() title = '';

    @Input() submitted = false;

    @Input() choices: Choice<any>[] = [];

    @Output() change: EventEmitter<Event> = new EventEmitter(); // tslint:disable-line
    dateValue = new DateHelper({
        getValue: () => this.formControlRef.value,
        setValue: (val: string) => this.formControlRef.setValue(val),
    });
    dateValueEnd = new DateHelper({
        getValue: () => this.formControlRefEnd.value,
        setValue: (val: string) => this.formControlRefEnd.setValue(val),
    });

    get isRequired(): boolean {
        return this.formControlRef.validator === Validators.required;
    }

    @ViewChild('formControlEl', { read: ElementRef }) formControlElRef: ElementRef;

    readonly itemTags$: Observable<string[]>;
    readonly getItemTags: () => Observable<string[]>;

    private static _nextUniqueId = 0;
    readonly uniqueId: string;

    constructor(private dialogService: NbDialogService, private api: ApiService, private itemTags: ItemsService) {
        this.itemTags$ = itemTags.itemTags$;
        this.getItemTags = () => itemTags.itemTags$;
        this.uniqueId = `_${FormElementComponent._nextUniqueId}`;
        FormElementComponent._nextUniqueId++;
    }

    get error(): string {
        if (this.formControlRef.errors) {
            if (this.formControlRef.errors.required && (this.submitted || this.formControlRef.dirty)) {
                return this.title + ' is required';
            } else if (this.formControlRef.errors.matchPassword && (this.submitted || this.formControlRef.dirty)) {
                return 'Passwords do not match';
            } else if (this.formControlRef.errors.pattern && (this.submitted || this.formControlRef.dirty)) {
                return this.title + ' invalid. Expecting ' + this.formControlRef.errors.pattern.requiredPattern + '.';
            } else if (this.formControlRef.errors.external) {
                return this.formControlRef.errors.external;
            }
        }
        return null;
    }

    openDialog($event: MouseEvent, dialog: TemplateRef<any>, context?: any) {
        $event.preventDefault();
        $event.stopPropagation();
        this.dialogService.open(dialog, {
            hasBackdrop: true,
            closeOnBackdropClick: true,
            hasScroll: false,
            autoFocus: true,
            context,
        });
    }

    get itemPicturePreviewUrl(): string {
        return this.api.getPicturePreviewUrl(this.formControlRef.value);
    }

    delayShow(elem) {
        of(null)
            .pipe(delay(1))
            .subscribe(() => elem.show());
    }

    click() {
        this.formControlElRef.nativeElement.click();
    }
}
