import { Pipe, PipeTransform } from '@angular/core';
import { UsersService } from '../_services';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Pipe({
    name: 'userName',
    standalone: false
})
export class UserNamePipe implements PipeTransform {
    constructor(private usersService: UsersService) {}

    transform(value: string): Observable<string> {
        if (!value) {
            return null;
        }
        return this.usersService.getUser(value).pipe(
            tap((user) => console.log('GetUser(', value, user)),
            map((user) => user.name)
        );
    }
}
