import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CaptureResultsDialogComponent, CaptureResult } from './capture-results-dialog.component';
import { TimeoutAlertService } from '../services/timeout-alert.service';

interface GamingSession {
  id: string;
  storeId: string;
  userId: string;
  stationId: string;
  durationMins: number;
  ratePerHour: string;
  status: string;
  startedAt: string;
  endedAt?: string;
}

interface SessionWithDetails extends GamingSession {
  playerName?: string;
  stationName?: string;
  cost?: number;
  timeLeft?: string;
}

@Component({
  selector: 'app-live-sessions',
  standalone: true,
  imports: [CommonModule, CaptureResultsDialogComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            (click)="router.navigate([''])"
            class="text-white hover:text-cyan-400 transition-colors p-2"
          >
            <span class="text-2xl">←</span>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-white">Live Sessions</h1>
            <p class="text-slate-400 text-sm">Monitor and manage active gaming sessions</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="bg-green-600/30 border border-green-400/50 rounded-full px-4 py-2 text-green-400 text-sm font-semibold flex items-center gap-2">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {{ activeSessions().length }} Active
          </span>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-8 overflow-auto">
        @if (activeSessions().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (session of activeSessions(); track session.id) {
              <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                <!-- Status Badge -->
                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-600/20 to-green-700/10 border-b border-green-400/20">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    <span class="text-green-400 font-semibold text-sm">LIVE</span>
                  </div>
                  <span class="text-white font-bold text-lg">{{ session.cost | currency }}</span>
                </div>

                <!-- Session Info -->
                <div class="p-4 space-y-3">
                  <div>
                    <h3 class="text-white font-bold text-lg">{{ session.playerName || 'Player' }}</h3>
                    <p class="text-slate-400 text-xs">{{ session.stationName || 'Station' }}</p>
                  </div>

                  <!-- Time Info -->
                  <div [ngClass]="session.timeLeft === '0 min' ? 'border-red-400/50 bg-red-600/10' : 'border-white/10 bg-white/5'" class="p-3 rounded-lg border">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2" [ngClass]="session.timeLeft === '0 min' ? 'text-red-300' : 'text-slate-300'">
                        <span>⏱️</span>
                        <span class="text-sm">{{ session.timeLeft }} left</span>
                      </div>
                      <span [ngClass]="session.timeLeft === '0 min' ? 'text-red-400' : 'text-slate-400'" class="text-xs">{{ session.durationMins }} min total</span>
                    </div>
                  </div>

                  <!-- Station -->
                  <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div class="flex items-center gap-2 text-slate-300">
                      <span>🖥️</span>
                      <span class="text-sm">{{ session.stationName || 'Loading...' }}</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 pt-2">
                    <button
                      (click)="endSession(session.id)"
                      class="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      <span>End & Capture</span>
                    </button>
                    <button
                      (click)="cancelSession(session.id)"
                      class="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-400/50 text-red-400 font-semibold text-sm rounded-lg transition-colors"
                      title="Cancel session"
                    >
                      <span>✕</span>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center min-h-96 text-center">
            <div class="text-6xl mb-4">🎮</div>
            <h3 class="text-2xl font-bold text-white mb-2">No Active Sessions</h3>
            <p class="text-slate-400 mb-6">Start a new gaming session to see it appear here</p>
            <button
              (click)="router.navigate([''])"
              class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        }
      </main>

      <!-- Capture Results Dialog -->
      @if (showCaptureDialog()) {
        <app-capture-results-dialog
          [gameName]="'PixelDust · tesr'"
          (save)="onCaptureResultsSave($event)"
          (closeDialog)="onCaptureResultsClose()"
        ></app-capture-results-dialog>
      }
    </div>
  `,
  styles: [],
})
export class LiveSessionsComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  public router = inject(Router);
  private apiUrl = environment.apiUrl;

  activeSessions = signal<SessionWithDetails[]>([]);
  showCaptureDialog = signal(false);
  private currentSessionId = signal<string | null>(null);
  private stationMap = signal<Map<string, string>>(new Map());
  private timeoutAlertService = inject(TimeoutAlertService);

  ngOnInit(): void {
    this.loadStations();
    this.loadActiveSessions();
    setInterval(() => this.loadActiveSessions(), 5000);
  }

  private loadStations(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http.get<{ data: { id: string; name: string }[] }>(`${this.apiUrl}/api/gaming-sessions/stations/${storeId}`).subscribe({
      next: (response) => {
        const map = new Map<string, string>();
        response.data?.forEach(station => {
          map.set(station.id, station.name);
        });
        this.stationMap.set(map);
      },
      error: (err) => {
        console.error('Failed to load gaming stations:', err);
      },
    });
  }

  private loadActiveSessions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http.get<{ data: GamingSession[] }>(`${this.apiUrl}/api/gaming-sessions/store/${storeId}`).subscribe({
      next: (response) => {
        const activeSessions = response.data?.filter(s => s.status === 'active') || [];
        this.activeSessions.set(activeSessions.map(session => this.enrichSession(session)));
      },
      error: (err) => {
        console.error('Failed to load active sessions:', err);
      },
    });
  }

  private enrichSession(session: GamingSession): SessionWithDetails {
    const startedAt = new Date(session.startedAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);
    const remainingMinutes = Math.max(0, session.durationMins - elapsedMinutes);

    const cost = (parseFloat(session.ratePerHour) / 60) * session.durationMins;
    const stationName = this.stationMap().get(session.stationId) || 'Unknown Station';

    return {
      ...session,
      cost,
      timeLeft: `${remainingMinutes} min`,
      playerName: 'CrystalWolf',
      stationName,
    };
  }

  endSession(sessionId: string): void {
    this.currentSessionId.set(sessionId);
    this.showCaptureDialog.set(true);
  }

  onCaptureResultsSave(result: CaptureResult): void {
    const sessionId = this.currentSessionId();
    if (!sessionId) return;

    this.http.put(`${this.apiUrl}/api/gaming-sessions/${sessionId}/end`, {
      captureResult: result,
    }).subscribe({
      next: () => {
        console.log('Session ended with capture result');
        this.showCaptureDialog.set(false);
        this.currentSessionId.set(null);
        this.loadActiveSessions();
      },
      error: (err) => {
        console.error('Failed to end session:', err);
      },
    });
  }

  onCaptureResultsClose(): void {
    this.showCaptureDialog.set(false);
    this.currentSessionId.set(null);
  }

  cancelSession(sessionId: string): void {
    if (confirm('Are you sure you want to cancel this session?')) {
      this.http.put(`${this.apiUrl}/api/gaming-sessions/${sessionId}/end`, { status: 'cancelled' }).subscribe({
        next: () => {
          console.log('Session cancelled');
          this.loadActiveSessions();
        },
        error: (err) => {
          console.error('Failed to cancel session:', err);
        },
      });
    }
  }
}
