import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes nécessitant une authentification
 */
export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isLoggedIn();

  console.log('AuthGuard: isAuthenticated =', isAuthenticated);

  if (isAuthenticated) {
    return true;
  }

  // Rediriger vers Keycloak via AuthService
  authService.redirectToLogin();
  return false;
};

/**
 * Guard pour empêcher l'accès aux pages d'auth si déjà connecté
 */
export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  try {
    const isAuthenticated = await authService.isLoggedIn();
    console.log('GuestGuard: isAuthenticated =', isAuthenticated);

    if (!isAuthenticated) {
      return true;
    }

    // Rediriger vers le dashboard approprié selon le rôle
    authService.redirectToDashboard();
    return false;
  } catch (error) {
    console.error('GuestGuard error:', error);
    return true; // Permettre l'accès en cas d'erreur
  }
};

/**
 * Guard pour vérifier les rôles
 */
export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = await authService.isLoggedIn();

  console.log('RoleGuard: Checking access to', state.url);
  console.log('RoleGuard: isAuthenticated =', isAuthenticated);

  if (!isAuthenticated) {
    console.log('RoleGuard: Not authenticated, redirecting to login');
    authService.redirectToLogin();
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  console.log('RoleGuard: Required roles =', requiredRoles);

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    console.log('RoleGuard: Access granted');
    return true;
  }

  console.log('RoleGuard: Access denied');
  router.navigate(['/access-denied']);
  return false;
};

/**
 * Guard pour rediriger vers le dashboard approprié selon le rôle
 */
export const dashboardRedirectGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isLoggedIn();

  if (!isAuthenticated) {
    authService.redirectToLogin();
    return false;
  }

  // Rediriger vers le dashboard approprié selon le rôle
  if (authService.hasAnyRole(['ADMIN'])) {
    router.navigate(['/admin/dashboard']);
  } else if (authService.hasAnyRole(['WAREHOUSE_MANAGER'])) {
    router.navigate(['/manager/dashboard']);
  } else if (authService.hasAnyRole(['CLIENT'])) {
    router.navigate(['/client/dashboard']);
  } else {
    router.navigate(['/access-denied']);
  }
  
  return false; // Toujours false car on redirige
};

