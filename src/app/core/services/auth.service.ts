import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  User
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  // Signals pour l'état d'authentification
  private _isAuthenticated = signal<boolean>(this.hasValidToken());
  private _currentUser = signal<User | null>(this.getStoredUser());
  private _isLoading = signal<boolean>(false);

  // Computed signals exposés
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentUser());
  readonly isLoading = computed(() => this._isLoading());

  // Subject pour la gestion du refresh token
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.storeTokens(response);
        this.decodeAndStoreUser(response.accessToken);
        this._isAuthenticated.set(true);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inscription utilisateur
   */
  register(userData: RegisterRequest): Observable<User> {
    this._isLoading.set(true);
    
    return this.http.post<User>(`${this.API_URL}/register`, userData).pipe(
      tap(() => {
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): Observable<void> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    const body = {
      token: accessToken,
      refreshToken: refreshToken
    };

    return this.http.post<void>(`${this.API_URL}/logout`, body, { headers }).pipe(
      tap(() => {
        this.clearAuth();
      }),
      catchError(error => {
        // Nettoyer même en cas d'erreur
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  /**
   * Rafraîchir le token
   */
  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: TokenRefreshRequest = { refreshToken };

    return this.http.post<TokenRefreshResponse>(`${this.API_URL}/refreshtoken`, request).pipe(
      tap(response => {
        this.storeTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        });
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  /**
   * Stocker les tokens
   */
  private storeTokens(tokens: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  /**
   * Décoder le JWT et stocker les infos utilisateur
   */
  private decodeAndStoreUser(token: string): void {
    try {
      const payload = this.decodeJwt(token);
      const user: User = {
        id: payload.sub || payload.userId || '',
        email: payload.sub || payload.email || '',
        name: payload.name || payload.preferred_username || '',
        contact: payload.contact || '',
        role: payload.role || payload.roles?.[0] || 'CLIENT',
        active: true
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this._currentUser.set(user);
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  }

  /**
   * Décoder un JWT
   */
  private decodeJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  /**
   * Récupérer l'access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Récupérer le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Récupérer l'utilisateur stocké
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Vérifier si le token est valide (non expiré)
   */
  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = this.decodeJwt(token);
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Vérifier si le token est sur le point d'expirer (moins de 5 minutes)
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = this.decodeJwt(token);
      const expirationDate = new Date(payload.exp * 1000);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return expirationDate < fiveMinutesFromNow;
    } catch {
      return true;
    }
  }

  /**
   * Nettoyer l'authentification
   */
  clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
  }

  /**
   * Rediriger vers la page de connexion
   */
  redirectToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this._currentUser();
    return user?.role === role;
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this._currentUser();
    return user ? roles.includes(user.role) : false;
  }
}
