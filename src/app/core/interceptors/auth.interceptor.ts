import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Intercepteur HTTP pour ajouter le token d'authentification
 * et gérer le rafraîchissement automatique
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Ne pas intercepter les requêtes d'authentification
  if (isAuthRequest(req.url)) {
    return next(req);
  }

  // Ajouter le token si disponible
  const token = authService.getAccessToken();
  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gérer les erreurs 401 (non autorisé)
      if (error.status === 401 && !isAuthRequest(req.url)) {
        return handle401Error(req, next, authService);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Vérifie si la requête est une requête d'authentification
 */
function isAuthRequest(url: string): boolean {
  const authEndpoints = ['/auth/login', '/auth/register', '/auth/refreshtoken'];
  return authEndpoints.some(endpoint => url.includes(endpoint));
}

/**
 * Ajoute le token à la requête
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Gère les erreurs 401 en tentant de rafraîchir le token
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    
    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap(response => {
          isRefreshing = false;
          refreshTokenSubject.next(response.accessToken);
          return next(addTokenToRequest(req, response.accessToken));
        }),
        catchError(error => {
          isRefreshing = false;
          authService.clearAuth();
          authService.redirectToLogin();
          return throwError(() => error);
        })
      );
    } else {
      isRefreshing = false;
      authService.clearAuth();
      authService.redirectToLogin();
      return throwError(() => new Error('No refresh token available'));
    }
  }

  // Attendre que le refresh soit terminé
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addTokenToRequest(req, token!)))
  );
}
