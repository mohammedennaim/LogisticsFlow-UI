import { Routes } from '@angular/router';
import { authGuard, roleGuard, dashboardRedirectGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  // Routes Auth (login/register)
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Connexion - LogisticsFlow'
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Inscription - LogisticsFlow'
  },
  // Dashboard Admin
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/dashboard/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    title: 'Admin Dashboard - LogisticsFlow'
  },
  // Dashboard Manager
  {
    path: 'manager/dashboard',
    loadComponent: () => import('./features/dashboard/manager/manager-dashboard.component').then(m => m.ManagerDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['WAREHOUSE_MANAGER'] },
    title: 'Manager Dashboard - LogisticsFlow'
  },
  // Dashboard Client
  {
    path: 'client/dashboard',
    loadComponent: () => import('./features/dashboard/client/client-dashboard.component').then(m => m.ClientDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['CLIENT'] },
    title: 'Espace Client - LogisticsFlow'
  },
  // Dashboard général - redirige vers le dashboard approprié selon le rôle
  {
    path: 'dashboard',
    canActivate: [dashboardRedirectGuard],
    children: [] // Route vide, le guard gère la redirection
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./features/access-denied/access-denied.component').then(m => m.AccessDeniedComponent),
    title: 'Accès refusé - LogisticsFlow'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
