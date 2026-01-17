import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private keycloakService = inject(KeycloakService);

  isLoading = signal(false);

  login(): void {
    this.isLoading.set(true);
    // Keycloak 17+ n'utilise plus le préfixe /auth
    const { url, realm, clientId } = environment.keycloak;
    const keycloakUrl = `${url}/realms/${realm}/protocol/openid-connect/auth`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/dashboard`,
      response_type: 'code',
      scope: 'openid'
    });
    
    console.log('Redirection Keycloak vers:', keycloakUrl);
    window.location.href = `${keycloakUrl}?${params.toString()}`;
  }
}
