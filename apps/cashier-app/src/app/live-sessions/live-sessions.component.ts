import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  CaptureResultsDialogComponent,
  CaptureResult,
} from './capture-results-dialog.component';
import { TimeoutAlertService } from '../services/timeout-alert.service';
import { FormsModule } from '@angular/forms';

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

interface User {
  id: string;
  email?: string;
  cellphone?: string;
}

interface PricingOption {
  id: string;
  durationMins: number;
  ratePerHour: string;
  label?: string;
  isActive: boolean;
}

interface Game {
  id: string;
  name: string;
  isActive: boolean;
}

interface DurationOption {
  id: string;
  minutes: number;
  isActive: boolean;
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
  imports: [CommonModule, FormsModule, CaptureResultsDialogComponent],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
    >
      <!-- Header -->
      <header
        class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <button
            (click)="router.navigate([''])"
            class="text-white hover:text-cyan-400 transition-colors p-2"
          >
            <span class="text-2xl">←</span>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-white">Live Sessions</h1>
            <p class="text-slate-400 text-sm">
              Monitor and manage active gaming sessions
            </p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span
            class="bg-green-600/30 border border-green-400/50 rounded-full px-4 py-2 text-green-400 text-sm font-semibold flex items-center gap-2"
          >
            <span
              class="w-2 h-2 bg-green-400 rounded-full animate-pulse"
            ></span>
            {{ activeSessions().length }} Active
          </span>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-8 overflow-auto">
        @if (activeSessions().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (session of activeSessions(); track session.id) {
              <div
                class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <!-- Status Badge -->
                <div
                  class="flex items-center justify-between p-4 bg-gradient-to-r from-green-600/20 to-green-700/10 border-b border-green-400/20"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="w-3 h-3 bg-green-400 rounded-full animate-pulse"
                    ></span>
                    <span class="text-green-400 font-semibold text-sm"
                      >LIVE</span
                    >
                  </div>
                  <span class="text-white font-bold text-lg">{{
                    session.cost | number: '1.2-2'
                  }}</span>
                </div>

                <!-- Session Info -->
                <div class="p-4 space-y-3">
                  <div>
                    <h3 class="text-white font-bold text-lg">
                      {{ session.playerName || 'Player' }}
                    </h3>
                    <p class="text-slate-400 text-xs">
                      {{ session.stationName || 'Station' }}
                    </p>
                  </div>

                  <!-- Time Info -->
                  <div
                    [ngClass]="
                      session.timeLeft === '0 min'
                        ? 'border-red-400/50 bg-red-600/10'
                        : 'border-white/10 bg-white/5'
                    "
                    class="p-3 rounded-lg border"
                  >
                    <div class="flex items-center justify-between">
                      <div
                        class="flex items-center gap-2"
                        [ngClass]="
                          session.timeLeft === '0 min'
                            ? 'text-red-300'
                            : 'text-slate-300'
                        "
                      >
                        <span>⏱️</span>
                        <span class="text-sm">{{ session.timeLeft }} left</span>
                      </div>
                      <span
                        [ngClass]="
                          session.timeLeft === '0 min'
                            ? 'text-red-400'
                            : 'text-slate-400'
                        "
                        class="text-xs"
                        >{{ session.durationMins }} min total</span
                      >
                    </div>
                  </div>

                  <!-- Station -->
                  <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div class="flex items-center gap-2 text-slate-300">
                      <span>🖥️</span>
                      <span class="text-sm">{{
                        session.stationName || 'Loading...'
                      }}</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 pt-2">
                    <button
                      (click)="captureResults(session.id)"
                      class="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                      title="Record results without ending session"
                    >
                      <span>📊</span>
                      <span>Capture</span>
                    </button>
                    <button
                      (click)="extendSession(session.id)"
                      class="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                      title="Extend session duration"
                    >
                      <span>⏱️</span>
                      <span>Extend</span>
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
          <div
            class="flex flex-col items-center justify-center min-h-96 text-center"
          >
            <div class="text-6xl mb-4">🎮</div>
            <h3 class="text-2xl font-bold text-white mb-2">
              No Active Sessions
            </h3>
            <p class="text-slate-400 mb-6">
              Start a new gaming session to see it appear here
            </p>
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
          [games]="games()"
          [players]="players()"
          [sessionPlayer]="getCurrentSessionPlayer()"
          (save)="onCaptureResultsSave($event)"
          (closeDialog)="onCaptureResultsClose()"
        ></app-capture-results-dialog>
      }

      <!-- Extend Session Dialog -->
      @if (showExtendDialog()) {
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2"
        >
          <div
            class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md"
          >
            <!-- Modal Header -->
            <div
              class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl text-purple-400">⏱️</span>
                <h2 class="text-xl font-bold text-white">Extend Session</h2>
              </div>
              <button
                (click)="closeExtendDialog()"
                class="text-white hover:text-purple-400 text-xl"
              >
                ✕
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <div
                class="bg-purple-600/20 border border-purple-400/50 rounded-lg p-4"
              >
                <p class="text-white font-semibold mb-2">⏱️ Additional Time</p>
                <p class="text-slate-300 text-sm">
                  How many additional minutes would you like to add to this
                  session?
                </p>
              </div>

              <!-- Duration Dropdown -->
              <div>
                <label class="block text-sm text-slate-300 font-semibold mb-2"
                  >Additional Duration</label
                >
                <select
                  [(ngModel)]="extendDurationMins"
                  [value]="extendDurationMins()"
                  (ngModelChange)="extendDurationMins.set($event)"
                  class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
                >
                  <option value="">Select duration...</option>
                  @for (duration of durationOptions(); track duration.id) {
                    <option [value]="duration.minutes">
                      {{ duration.minutes }} min
                    </option>
                  }
                </select>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  (click)="submitExtendSession()"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all"
                >
                  Extend Session
                </button>
                <button
                  (click)="closeExtendDialog()"
                  class="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded-lg transition-all border border-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
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
  showExtendDialog = signal(false);
  games = signal<Game[]>([]);
  durationOptions = signal<DurationOption[]>([]);
  players = signal<User[]>([]);
  extendDurationMins = signal<string>('');
  private currentSessionId = signal<string | null>(null);
  private currentSessionPlayer = signal<User | undefined>(undefined);
  private stationMap = signal<Map<string, string>>(new Map());
  private userMap = signal<Map<string, User>>(new Map());
  private pricingOptions = signal<PricingOption[]>([]);
  private timeoutAlertService = inject(TimeoutAlertService);

  ngOnInit(): void {
    this.loadStations();
    this.loadPricingOptions();
    this.loadGames();
    this.loadDurationOptions();
    this.loadPlayers();
    this.loadActiveSessions();
    setInterval(() => this.loadActiveSessions(), 5000);
  }

  private loadStations(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http
      .get<{
        data: { id: string; name: string }[];
      }>(`${this.apiUrl}/api/gaming-sessions/stations/${storeId}`)
      .subscribe({
        next: (response) => {
          const map = new Map<string, string>();
          response.data?.forEach((station) => {
            map.set(station.id, station.name);
          });
          this.stationMap.set(map);
        },
        error: (err) => {
          console.error('Failed to load gaming stations:', err);
        },
      });
  }

  private loadPricingOptions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http
      .get<{
        data: PricingOption[];
      }>(`${this.apiUrl}/api/stores/${storeId}/pricing-options`)
      .subscribe({
        next: (response) => {
          console.log('Pricing options loaded:', response.data);
          this.pricingOptions.set(response.data || []);
        },
        error: (err) => {
          console.error('Failed to load pricing options:', err);
        },
      });
  }

  private loadGames(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http
      .get<{
        data: Game[];
      }>(`${this.apiUrl}/api/gaming-sessions/games/${storeId}`)
      .subscribe({
        next: (response) => {
          const activeGames = (response.data || []).filter((g) => g.isActive);
          this.games.set(activeGames);
        },
        error: (err) => {
          console.error('Failed to load games:', err);
        },
      });
  }

  private loadDurationOptions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http
      .get<{
        data: DurationOption[];
      }>(`${this.apiUrl}/api/gaming-sessions/durations/${storeId}`)
      .subscribe({
        next: (response) => {
          const activeDurations = (response.data || []).filter(
            (d) => d.isActive,
          );
          // Remove duplicates by minutes
          const uniqueDurations = Array.from(
            new Map(activeDurations.map((d) => [d.minutes, d])).values()
          );
          this.durationOptions.set(uniqueDurations);
          // Set default to first configured duration
          if (uniqueDurations.length > 0) {
            this.extendDurationMins.set(uniqueDurations[0].minutes.toString());
          }
        },
        error: (err) => {
          console.error('Failed to load duration options:', err);
        },
      });
  }

  private loadPlayers(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    // Load all sessions to get unique players
    this.http
      .get<{
        data: GamingSession[];
      }>(`${this.apiUrl}/api/gaming-sessions/store/${storeId}`)
      .subscribe({
        next: (response) => {
          if (response.data) {
            const uniqueUserIds = Array.from(new Set(response.data.map(s => s.userId)));
            const playersList: User[] = [];
            let loadedCount = 0;

            uniqueUserIds.forEach(userId => {
              this.http
                .get<{ data: User }>(`${this.apiUrl}/api/players/${userId}`)
                .subscribe({
                  next: (playerResponse) => {
                    if (playerResponse.data) {
                      playersList.push(playerResponse.data);
                    }
                    loadedCount++;
                    if (loadedCount === uniqueUserIds.length) {
                      this.players.set(playersList);
                    }
                  },
                  error: () => {
                    loadedCount++;
                    if (loadedCount === uniqueUserIds.length) {
                      this.players.set(playersList);
                    }
                  },
                });
            });
          }
        },
        error: (err) => {
          console.error('Failed to load players:', err);
        },
      });
  }

  private loadActiveSessions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http
      .get<{
        data: GamingSession[];
      }>(`${this.apiUrl}/api/gaming-sessions/store/${storeId}`)
      .subscribe({
        next: (response) => {
          const activeSessions =
            response.data?.filter((s) => s.status === 'active') || [];
          this.activeSessions.set(
            activeSessions.map((session) => this.enrichSession(session)),
          );
        },
        error: (err) => {
          console.error('Failed to load active sessions:', err);
        },
      });
  }

  private enrichSession(session: GamingSession): SessionWithDetails {
    const startedAt = new Date(session.startedAt);
    const now = new Date();
    const elapsedMinutes = Math.floor(
      (now.getTime() - startedAt.getTime()) / 60000,
    );
    const remainingMinutes = Math.max(0, session.durationMins - elapsedMinutes);

    // Get rate from configured pricing options for this duration
    const pricingOptions = this.pricingOptions();
    console.log('Available pricing options:', pricingOptions);
    console.log('Session duration:', session.durationMins);

    const pricingOption = pricingOptions.find(
      (p) => p.isActive && p.durationMins === session.durationMins,
    );
    console.log('Matching pricing option:', pricingOption);

    const ratePerHour = pricingOption
      ? parseFloat(pricingOption.ratePerHour)
      : parseFloat(session.ratePerHour);
    console.log('Rate per hour:', ratePerHour);

    const cost = ratePerHour;
    console.log('Cost:', cost);

    const stationName =
      this.stationMap().get(session.stationId) || 'Unknown Station';

    // Get player name from user cache, or fetch if not available
    let playerName = 'Loading...';
    const cachedUser = this.userMap().get(session.userId);
    if (cachedUser) {
      playerName = cachedUser.email || cachedUser.cellphone || 'Player';
    } else {
      // Fetch user info
      this.http
        .get<{ data: User }>(`${this.apiUrl}/api/players/${session.userId}`)
        .subscribe({
          next: (response) => {
            const userMap = this.userMap();
            userMap.set(session.userId, response.data);
            this.userMap.set(userMap);
            // Update the session with new player name
            this.loadActiveSessions();
          },
          error: (err) => {
            console.error('Failed to load user:', err);
          },
        });
    }

    return {
      ...session,
      cost,
      timeLeft: `${remainingMinutes} min`,
      playerName,
      stationName,
    };
  }

  captureResults(sessionId: string): void {
    this.currentSessionId.set(sessionId);
    // Get the player for this session
    const session = this.activeSessions().find(s => s.id === sessionId);
    if (session?.userId) {
      this.http
        .get<{ data: User }>(`${this.apiUrl}/api/players/${session.userId}`)
        .subscribe({
          next: (response) => {
            this.currentSessionPlayer.set(response.data);
            this.showCaptureDialog.set(true);
          },
          error: () => {
            this.showCaptureDialog.set(true);
          },
        });
    } else {
      this.showCaptureDialog.set(true);
    }
  }

  getCurrentSessionPlayer(): User | undefined {
    return this.currentSessionPlayer();
  }

  onCaptureResultsSave(result: CaptureResult): void {
    const sessionId = this.currentSessionId();
    if (!sessionId) return;

    console.log('Saving results for session:', sessionId);
    console.log('Result data:', result);

    // Save to the unified game-results endpoint with OCR and image data
    // This creates ONE entry with all data combined (game, score, result, ocrResults, captureImage)
    this.http
      .post(`${this.apiUrl}/api/game-results`, {
        sessionId: sessionId,
        game: result.game,
        score: result.score || 0,
        result: result.result,
        gameType: result.gameType,
        opponentUserId: result.opponentUserId,
        player1Score: result.player1Score,
        player2Score: result.player2Score,
        winner: result.winner,
        ocrResults: result.ocrResults,
        captureImage: result.captureImage,
      })
      .subscribe({
        next: (response) => {
          console.log('Game result saved successfully:', response);
          this.showCaptureDialog.set(false);
          this.currentSessionId.set(null);
          this.currentSessionPlayer.set(undefined);
          this.loadActiveSessions();
          alert('✅ Game result captured successfully with OCR and image!\n\nNavigate to Results History to verify.');
        },
        error: (err) => {
          console.error('Failed to capture results:', err);
          const errorMsg = err.error?.error || 'Unknown error';
          alert(`❌ Failed to capture results: ${errorMsg}`);
        },
      });
  }

  extendSession(sessionId: string): void {
    this.currentSessionId.set(sessionId);
    this.showExtendDialog.set(true);
  }

  submitExtendSession(): void {
    const sessionId = this.currentSessionId();
    if (!sessionId) return;

    const additionalMinsStr = this.extendDurationMins();
    if (!additionalMinsStr) {
      console.error('Please select a duration');
      return;
    }

    const additionalMinutes = parseInt(additionalMinsStr, 10);

    this.http
      .post(`${this.apiUrl}/api/gaming-sessions/${sessionId}/extend`, {
        additionalMins: additionalMinutes,
      })
      .subscribe({
        next: () => {
          console.log('Session extended by ' + additionalMinutes + ' minutes');
          this.showExtendDialog.set(false);
          this.currentSessionId.set(null);
          this.extendDurationMins.set('30');
          this.loadActiveSessions();
        },
        error: (err) => {
          console.error('Failed to extend session:', err);
        },
      });
  }

  closeExtendDialog(): void {
    this.showExtendDialog.set(false);
    this.currentSessionId.set(null);
    this.extendDurationMins.set('30');
  }

  onCaptureResultsClose(): void {
    this.showCaptureDialog.set(false);
    this.currentSessionId.set(null);
  }

  cancelSession(sessionId: string): void {
    if (confirm('Are you sure you want to cancel this session?')) {
      this.http
        .put(`${this.apiUrl}/api/gaming-sessions/${sessionId}/end`, {
          status: 'cancelled',
        })
        .subscribe({
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
