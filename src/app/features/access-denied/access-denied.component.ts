import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="access-denied-container">
      <div class="access-denied-card">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1>Accès Refusé</h1>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <div class="actions">
          <a routerLink="/dashboard" class="btn btn-primary">Retour au tableau de bord</a>
          <a routerLink="/auth/login" class="btn btn-secondary">Se reconnecter</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .access-denied-card {
      background: white;
      border-radius: 1rem;
      padding: 3rem;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .icon-wrapper svg {
      width: 40px;
      height: 40px;
      color: #dc2626;
    }

    h1 {
      font-size: 1.5rem;
      color: #1f2937;
      margin: 0 0 0.75rem 0;
    }

    p {
      color: #6b7280;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class AccessDeniedComponent {}
