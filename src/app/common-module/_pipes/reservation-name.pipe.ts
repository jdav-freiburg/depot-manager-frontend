import { Pipe, PipeTransform } from '@angular/core';
import { ReservationsService } from '../_services';

@Pipe({
    name: 'reservationName',
    standalone: false
})
export class ReservationNamePipe implements PipeTransform {
    constructor(private reservationsService: ReservationsService) {}
    transform(value: string): Promise<string> {
        if (!value) {
            return null;
        }
        return this.reservationsService.getReservationById(value).then((reservation) => reservation.name);
    }
}
