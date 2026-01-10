import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Connexion - LogisticsFlow'
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Inscription - LogisticsFlow'
  }
];
