import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Tableau de bord - LogisticsFlow'
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
