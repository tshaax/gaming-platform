import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@org/fe/auth';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-violet-900">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="/playground-logo.png" alt="Playground Logo" class="h-12 w-auto" />
            <h1 class="text-2xl font-bold text-white">Playground</h1>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="viewLeaderboard()"
              class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              🏆 Leaderboard
            </button>
            <button
              (click)="viewPlayHistory()"
              class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              📊 Play History
            </button>
            <button
              (click)="logout()"
              class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Hero Section -->
        <div class="mb-12">
          <div class="bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div>
              <h2 class="text-4xl font-bold text-white mb-2">Welcome, {{ userInfo()?.email || userInfo()?.cellphone || 'Gamer' }}!</h2>
              <p class="text-purple-200 text-lg">Select an active gaming session to play</p>
            </div>
          </div>
        </div>

        <!-- Active Sessions Grid -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="inline-block w-8 h-8 border-4 border-purple-300 border-t-white rounded-full animate-spin"></div>
          </div>
        } @else if (sessions().length === 0) {
          <div class="text-center py-12">
            <p class="text-purple-200 text-lg">No active gaming sessions. Contact a cashier to start one.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (session of sessions(); track session.id) {
              <div
                (click)="selectSession(session)"
                class="bg-gradient-to-br from-cyan-600/30 to-blue-700/30 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 hover:from-cyan-600/40 hover:to-blue-700/40 transition-all cursor-pointer"
              >
                <div class="text-4xl mb-3">🎮</div>
                <h3 class="text-xl font-bold text-white mb-2">{{ session.storeName }}</h3>
                <p class="text-cyan-200 text-sm mb-2">Station: {{ session.stationName }}</p>
                @if (session.game) {
                  <p class="text-cyan-200 text-sm mb-2">Game: {{ session.game }}</p>
                }
                <p class="text-cyan-200 text-xs mb-4">Duration: {{ session.durationMins }} mins</p>
                <button class="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                  Continue Playing
                </button>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [],
})
export class LandingComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private expirationCheckInterval: any;

  userInfo = signal<{ email?: string | null; cellphone?: string | null; role?: string; userId?: string } | null>(null);
  sessions = signal<Array<{ id: string; storeId: string; storeName: string; stationName: string; game?: string; startedAt: Date; durationMins: number }>>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.userInfo.set({
      email: this.authService.user()?.email,
      cellphone: this.authService.user()?.cellphone,
      role: this.authService.role() || undefined,
      userId: this.authService.userId() || undefined,
    });

    this.fetchActiveSessions();
    this.startExpirationCheck();
  }

  ngOnDestroy(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
    }
  }

  private startExpirationCheck(): void {
    this.expirationCheckInterval = setInterval(() => {
      this.removeExpiredSessions();
    }, 1000); // Check every second
  }

  private removeExpiredSessions(): void {
    const currentSessions = this.sessions();
    const activeSessions: typeof currentSessions = [];
    const expiredSessions: typeof currentSessions = [];

    currentSessions.forEach(session => {
      const startedAt = new Date(session.startedAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const durationSeconds = session.durationMins * 60;

      if (elapsedSeconds < durationSeconds) {
        activeSessions.push(session);
      } else {
        expiredSessions.push(session);
      }
    });

    // End expired sessions on the backend
    expiredSessions.forEach(session => {
      console.log(`Ending expired session: ${session.id}`);
      this.http.put(
        `${this.apiUrl}/api/gaming-sessions/${session.id}/end`,
        {}
      ).subscribe({
        next: () => {
          console.log(`Session ${session.id} ended successfully`);
        },
        error: (err) => console.error(`Failed to end session ${session.id}:`, err),
      });
    });

    // Update sessions list if any expired
    if (activeSessions.length !== currentSessions.length) {
      console.log(`Removed ${currentSessions.length - activeSessions.length} expired session(s)`);
      this.sessions.set(activeSessions);
    }
  }

  private fetchActiveSessions(): void {
    this.http.get<{ data: Array<{ id: string; storeId: string; storeName: string; stationName: string; game?: string; startedAt: Date; durationMins: number }>; success: boolean }>(
      `${this.apiUrl}/api/gaming-sessions/user/active`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sessions.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectSession(session: { id: string; storeId: string; storeName: string; stationName: string; game?: string }): void {
    this.router.navigate(['/portal', session.storeId], { state: { session } });
  }

  viewPlayHistory(): void {
    this.router.navigate(['/history']);
  }

  viewLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  logout(): void {
    this.isLoading.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
