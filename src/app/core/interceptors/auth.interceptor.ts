import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

// Log immédiat pour vérifier que l'intercepteur est chargé
console.log('🔐 AUTH INTERCEPTOR LOADED (Keycloak version)');

/**
 * Intercepteur HTTP pour ajouter le token d'authentification Keycloak
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const keycloakService = inject(KeycloakService);

  // Ne pas intercepter les requêtes d'authentification Keycloak
  if (isAuthRequest(req.url)) {
    console.log('🔐 Skipping auth request:', req.url);
    return next(req);
  }

  // Récupérer le token depuis Keycloak
  return from(keycloakService.getToken()).pipe(
    switchMap(token => {
      console.log('🔐 Token exists:', !!token, 'URL:', req.url);
      
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('🔐 Authorization header added');
        return next(clonedReq);
      } else {
        console.warn('🔐 ⚠️ NO TOKEN - Request without auth');
        return next(req);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.log('🔐 Error', error.status, 'for', req.url);
      
      // Si 401, essayer de rafraîchir le token
      if (error.status === 401) {
        return from(keycloakService.updateToken(30)).pipe(
          switchMap(() => from(keycloakService.getToken())),
          switchMap(newToken => {
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(() => {
            console.log('🔐 Token refresh failed, redirecting to login');
            keycloakService.login();
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

/**
 * Vérifie si la requête est une requête d'authentification
 */
function isAuthRequest(url: string): boolean {
  const authEndpoints = ['/auth/', '/realms/', 'keycloak', '/protocol/openid-connect'];
  return authEndpoints.some(endpoint => url.includes(endpoint));
}
