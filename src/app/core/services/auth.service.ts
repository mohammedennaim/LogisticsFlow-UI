import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshResponse,
  User,
  UserRole
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly GENERIC_ERROR_MSG = 'Operation handled by Keycloak';

  // Signals pour l'état d'authentification
  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<User | null>(null);
  private _isLoading = signal<boolean>(false);

  // Computed signals exposés
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentUser());
  readonly isLoading = computed(() => this._isLoading());

  constructor(
    private keycloakService: KeycloakService,
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  /**
   * Initialiser l'état d'authentification au démarrage
   */
  private async initializeAuthState(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      console.log('AuthService: Keycloak isLoggedIn =', isLoggedIn);
      this._isAuthenticated.set(isLoggedIn);

      if (isLoggedIn) {
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('AuthService: Error checking Keycloak status', error);
      this._isAuthenticated.set(false);
    }
  }

  /**
   * Charger le profil utilisateur depuis Keycloak
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const profile: KeycloakProfile = await this.keycloakService.loadUserProfile();

      // Mapper KeycloakProfile vers notre modèle User
      // Note: Keycloak gère les rôles séparément, on utilise isUserInRole pour vérifier
      // Pour l'interface User, on va essayer de déterminer le rôle principal
      const role = this.determineMainRole();

      const user: User = {
        id: profile.id || '',
        email: profile.email || '',
        name: `${profile.firstName} ${profile.lastName}`.trim() || profile.username || '',
        contact: '', // Pas standard dans Keycloak profile
        role: role as UserRole,
        active: true // Supposé actif si connecté
      };

      this._currentUser.set(user);
      console.log('AuthService: User profile loaded', user);
    } catch (error) {
      console.error('AuthService: Error loading user profile', error);
    }
  }

  /**
   * Déterminer le rôle principal pour l'affichage/logique simple
   */
  private determineMainRole(): string {
    if (this.keycloakService.isUserInRole('ADMIN')) return 'ADMIN';
    if (this.keycloakService.isUserInRole('WAREHOUSE_MANAGER')) return 'WAREHOUSE_MANAGER';
    if (this.keycloakService.isUserInRole('CLIENT')) return 'CLIENT';
    return 'USER';
  }

  /**
   * Connexion utilisateur (Redirection Keycloak)
   * On ignore les credentials car on redirige vers la page de login Keycloak
   */
  login(credentials?: LoginRequest): Observable<AuthResponse> {
    // Redirection vers Keycloak
    this.keycloakService.login();
    // On retourne un observable vide qui ne sera jamais vraiment consommé car redirection
    return of({ accessToken: '', refreshToken: '' });
  }

  /**
   * Inscription utilisateur (Redirection Keycloak Register)
   */
  register(userData: RegisterRequest): Observable<User> {
    this.keycloakService.register();
    return of({} as User);
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): Observable<void> {
    // Utiliser from() pour convertir la Promise returned par keycloak.logout() en Observable
    return from(this.keycloakService.logout(window.location.origin));
  }

  /**
   * Rafraîchir le token (Géré automatiquement par Keycloak Interceptor)
   * Cette méthode est gardée pour compatibilité mais ne fait rien
   */
  refreshToken(): Observable<TokenRefreshResponse> {
    // Keycloak gère le refresh automatiquement
    return of({ accessToken: '', refreshToken: '' });
  }

  getAccessToken(): string | null {
    // Note: this returns a promise strictly speaking, but for compat we might return null
    // or we should update calling code.
    // For now, let's try to get it synchronously if possible or return empty string
    // KeycloakService.getToken() returns Promise<string>
    // CAUTION: This breaks the synchronous signature. 
    // However, Keycloak instance object usually has the token property.
    try {
      return this.keycloakService.getKeycloakInstance().token || null;
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return this.keycloakService.getKeycloakInstance().refreshToken || null;
    } catch {
      return null;
    }
  }

  redirectToLogin(): void {
    this.keycloakService.login();
  }

  hasRole(role: string): boolean {
    return this.keycloakService.isUserInRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.keycloakService.isUserInRole(role));
  }

  async isLoggedIn(): Promise<boolean> {
    const logged = await this.keycloakService.isLoggedIn();
    console.log('AuthService: isLoggedIn check =', logged);
    if (logged) {
      console.log('AuthService: User roles =', this.keycloakService.getUserRoles());
    }
    return logged;
  }

  getDashboardRoute(): string {
    if (this.hasRole('ADMIN')) return '/admin/dashboard';
    if (this.hasRole('WAREHOUSE_MANAGER')) return '/manager/dashboard';
    return '/client/dashboard';
  }

  redirectToDashboard(): void {
    const route = this.getDashboardRoute();
    console.log('AuthService: Redirecting to dashboard -', route);
    this.router.navigate([route]);
  }

  /**
   * Obtenir le profil utilisateur depuis Keycloak
   */
  async getUserProfile(): Promise<KeycloakProfile | null> {
    try {
      return await this.keycloakService.loadUserProfile();
    } catch (error) {
      console.error('AuthService: Error getting user profile', error);
      return null;
    }
  }

  /**
   * Obtenir les rôles de l'utilisateur
   */
  getUserRoles(): string[] {
    try {
      return this.keycloakService.getUserRoles();
    } catch (error) {
      console.error('AuthService: Error getting user roles', error);
      return [];
    }
  }
}

