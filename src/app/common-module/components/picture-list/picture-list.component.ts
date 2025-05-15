import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { Picture } from '../../_models';
import { ApiService } from '../../_services';

@Component({
    selector: 'depot-picture-list',
    templateUrl: './picture-list.component.html',
    styleUrls: ['./picture-list.component.scss'],
    standalone: false
})
export class PictureListComponent implements OnInit {
    pictures$: Observable<Picture[]>;
    reload$ = new BehaviorSubject<void>(undefined);

    @Input() public selectedPicture: string;
    @Output() public selectPicture = new EventEmitter<string>();

    constructor(private api: ApiService) {}

    ngOnInit() {
        this.pictures$ = this.reload$.pipe(
            switchMap(() => this.api.getPictures()),
            shareReplay(1)
        );
    }

    getPictureUrl(picture: Picture): string {
        return this.api.getPicturePreviewUrl(picture.id);
    }

    onFileDrop(files: NgxFileDropEntry[]) {
        for (const droppedFile of files) {
            // Is it a file?
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                    this.api.createPicture(file).subscribe((pictureId) => {
                        console.log('Saved picture', pictureId);
                        this.reload$.next();
                    });
                });
            }
        }
    }

    onOpen(openFileSelectorCallback) {
        // Needed for correct typing :-/
        openFileSelectorCallback();
    }
}
