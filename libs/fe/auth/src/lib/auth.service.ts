import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import type { AuthTokens, LoginRequest, UserRole } from '@org/models';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  storeId: string | null;
  role: UserRole | null;
  expiresAt: number | null;
  email?: string | null;
  cellphone?: string | null;
}

const INITIAL_STATE: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  storeId: null,
  role: null,
  expiresAt: null,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state = signal<AuthState>(this.loadState());
  readonly isAuthenticated = computed(() => !!this._state().accessToken);
  readonly user = computed(() => this._state());
  readonly role = computed(() => this._state().role);
  readonly userId = computed(() => this._state().userId);
  readonly storeId = computed(() => this._state().storeId);
  readonly accessToken$ = new BehaviorSubject<string | null>(this._state().accessToken);

  private apiUrl = 'http://localhost:3333';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(req: LoginRequest): Observable<AuthTokens> {
    return this.http.post<{ data: AuthTokens; success: boolean }>(`${this.apiUrl}/api/auth/login`, req).pipe(
      tap((response) => {
        this.storeTokens(response.data, req.storeId, req.email, req.cellphone);
      }),
      map((response) => response.data),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this._state().refreshToken;
    if (!refreshToken) {
      this.clearState();
      return new Observable((observer) => {
        observer.next();
        observer.complete();
      });
    }

    return this.http
      .post<{ data: null; success: boolean }>(`${this.apiUrl}/api/auth/logout`, { refreshToken })
      .pipe(
        tap(() => {
          this.clearState();
        }),
        map(() => undefined),
      );
  }

  refresh(): Observable<{ accessToken: string; expiresIn: number }> {
    const refreshToken = this._state().refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http
      .post<{ data: { accessToken: string; expiresIn: number }; success: boolean }>(
        `${this.apiUrl}/api/auth/refresh`,
        { refreshToken },
      )
      .pipe(
        tap((response) => {
          const result = response.data;
          const state = this._state();
          const newExpiresAt = Date.now() + result.expiresIn * 1000;
          this._state.set({
            ...state,
            accessToken: result.accessToken,
            expiresAt: newExpiresAt,
          });
          this.accessToken$.next(result.accessToken);
          this.saveState();
        }),
        map((response) => response.data),
      );
  }

  getAccessToken(): string | null {
    return this._state().accessToken;
  }

  isTokenExpired(): boolean {
    const expiresAt = this._state().expiresAt;
    if (!expiresAt) return true;
    return Date.now() > expiresAt - 60000;
  }

  private storeTokens(tokens: AuthTokens, storeId: string | undefined, email?: string, cellphone?: string): void {
    const decoded = this.decodeJwt(tokens.accessToken);
    const expiresAt = Date.now() + tokens.expiresIn * 1000;

    this._state.set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: decoded.sub,
      storeId: storeId ?? decoded.storeId,
      role: decoded.role,
      expiresAt,
      email,
      cellphone,
    });

    this.accessToken$.next(tokens.accessToken);
    this.saveState();
  }

  private clearState(): void {
    this._state.set(INITIAL_STATE);
    this.accessToken$.next(null);
    localStorage.removeItem('auth_state');
    this.router.navigate(['/login']);
  }

  private saveState(): void {
    const state = this._state();
    localStorage.setItem('auth_state', JSON.stringify(state));
  }

  private loadState(): AuthState {
    try {
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const state = JSON.parse(saved);
        // Check if token is still valid
        if (state.expiresAt && Date.now() < state.expiresAt) {
          return state;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return INITIAL_STATE;
  }

  private decodeJwt(token: string): { sub: string; role: UserRole; storeId: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');

    const decoded = JSON.parse(atob(parts[1]));
    return {
      sub: decoded.sub,
      role: decoded.role,
      storeId: decoded.storeId,
    };
  }
}
