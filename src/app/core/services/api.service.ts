import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  get<T>(endpoint: string, options?: object): Observable<T> {
    return this.http.get<T>(`${this.API_URL}${endpoint}`, options).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  post<T>(endpoint: string, data: unknown, options?: object): Observable<T> {
    return this.http.post<T>(`${this.API_URL}${endpoint}`, data, options).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  put<T>(endpoint: string, data: unknown, options?: object): Observable<T> {
    return this.http.put<T>(`${this.API_URL}${endpoint}`, data, options).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  patch<T>(endpoint: string, data: unknown, options?: object): Observable<T> {
    return this.http.patch<T>(`${this.API_URL}${endpoint}`, data, options).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  delete<T>(endpoint: string, options?: object): Observable<T> {
    return this.http.delete<T>(`${this.API_URL}${endpoint}`, options).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => ({ message: errorMessage, status: error.status, error }));
  }
}
