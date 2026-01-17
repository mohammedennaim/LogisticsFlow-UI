import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiHealthService {
  private http = inject(HttpClient);

  checkApiHealth(): Observable<boolean> {
    return this.http.get(`${environment.apiUrl}/api/test`, { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
