import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeoutAlertService } from '../services/timeout-alert.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@org/fe/auth';
import { environment } from '../../environments/environment';
import { CaptureResultsDialogComponent } from '../live-sessions/capture-results-dialog.component';

@Component({
  selector: 'app-global-timeout-alert',
  standalone: true,
  imports: [CommonModule, FormsModule, CaptureResultsDialogComponent],
  template: `
    @if (timeoutAlertService.showTimeoutAlert() && timeoutAlertService.timeoutSessionData()) {
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-gradient-to-br from-red-900/50 to-slate-900 rounded-2xl border-2 border-red-400 w-full max-w-md shadow-2xl animate-pulse">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-red-400/30 bg-red-600/10">
            <div class="flex items-center gap-3">
              <span class="text-4xl animate-bounce">⏰</span>
              <h2 class="text-2xl font-bold text-red-300">TIME'S UP!</h2>
            </div>
            <button
              (click)="onDismiss()"
              type="button"
              class="text-red-400 hover:text-red-200 transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          <!-- Session Details -->
          <div class="px-6 py-6 space-y-4">
            <div class="bg-red-600/20 rounded-lg p-4 border border-red-400/30">
              <p class="text-slate-300 text-sm mb-3">
                <span class="font-semibold text-red-300">Session Timeout Alert</span>
              </p>
              <div class="space-y-3">
                <!-- Player Name -->
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Player:</span>
                  <span class="text-white font-semibold">{{ timeoutAlertService.timeoutSessionData()?.playerName }}</span>
                </div>

                <!-- Station -->
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Station:</span>
                  <span class="text-white font-semibold">{{ timeoutAlertService.timeoutSessionData()?.stationName }}</span>
                </div>

                <!-- Duration -->
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Booked Duration:</span>
                  <span class="text-white font-semibold">{{ timeoutAlertService.timeoutSessionData()?.durationMins }} minutes</span>
                </div>

                <!-- Total Cost -->
                <div class="flex items-center justify-between pt-2 border-t border-red-400/20">
                  <span class="text-slate-400 font-semibold">Total Cost:</span>
                  <span class="text-red-300 font-bold text-lg">{{ formatCurrency(timeoutAlertService.timeoutSessionData()?.cost || 0) }}</span>
                </div>
              </div>
            </div>

            <!-- Message -->
            <div class="bg-yellow-600/20 rounded-lg p-3 border border-yellow-400/30">
              <p class="text-yellow-200 text-sm text-center">
                ⚠️ This session has exceeded its allocated time. Please end the session immediately.
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 p-6 border-t border-red-400/30 bg-red-600/5">
            <button
              (click)="onCaptureResults()"
              type="button"
              class="flex-1 px-3 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              title="Record results without ending session"
            >
              <span>📊</span>
              <span>Capture</span>
            </button>
            <button
              (click)="onExtendSession()"
              type="button"
              class="flex-1 px-3 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              title="Extend session duration"
            >
              <span>⏱️</span>
              <span>Extend</span>
            </button>
            <button
              (click)="onDismiss()"
              type="button"
              class="px-3 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    }

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
                  (ngModelChange)="extendDurationMins.set($event)"
                  class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
                >
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
  `,
  styles: [],
})
export class GlobalTimeoutAlertComponent implements OnInit {
  timeoutAlertService = inject(TimeoutAlertService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  showCaptureDialog = signal(false);
  showExtendDialog = signal(false);
  games = signal<any[]>([]);
  players = signal<any[]>([]);
  durationOptions = signal<any[]>([]);
  extendDurationMins = signal<string>('');
  private currentSessionData: any = null;

  ngOnInit(): void {
    this.timeoutAlertService.startMonitoring();
    this.loadGamesAndDurations();
  }

  private loadGamesAndDurations(): void {
    const storeId = this.authService.storeId();
    if (!storeId) return;

    // Load games
    this.http
      .get<{ data: any[] }>(`${this.apiUrl}/api/gaming-sessions/games/${storeId}`)
      .subscribe({
        next: (response) => {
          const activeGames = (response.data || []).filter((g) => g.isActive);
          // Remove duplicates by name
          const uniqueGames = Array.from(
            new Map(activeGames.map((g) => [g.name, g])).values()
          );
          this.games.set(uniqueGames);
        },
      });

    // Load duration options
    this.http
      .get<{ data: any[] }>(`${this.apiUrl}/api/gaming-sessions/durations/${storeId}`)
      .subscribe({
        next: (response) => {
          const activeDurations = (response.data || []).filter((d) => d.isActive);
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
      });

    // Load players
    this.http
      .get<{ data: any[] }>(`${this.apiUrl}/api/gaming-sessions/store/${storeId}`)
      .subscribe({
        next: (response) => {
          if (response.data) {
            const uniqueUserIds = Array.from(new Set(response.data.map((s) => s.userId)));
            const playersList: any[] = [];
            let loadedCount = 0;

            uniqueUserIds.forEach((userId) => {
              this.http
                .get<{ data: any }>(`${this.apiUrl}/api/players/${userId}`)
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
      });
  }

  onDismiss(): void {
    this.timeoutAlertService.dismissAlert();
  }

  onCaptureResults(): void {
    this.currentSessionData = this.timeoutAlertService.timeoutSessionData();
    this.showCaptureDialog.set(true);
  }

  onCaptureResultsSave(result: any): void {
    const sessionId = this.currentSessionData?.sessionId;
    if (!sessionId) return;

    this.http
      .post(`${this.apiUrl}/api/gaming-sessions/${sessionId}/results`, result)
      .subscribe({
        next: () => {
          this.showCaptureDialog.set(false);
          alert('✅ Game result captured successfully!');
        },
        error: (err) => {
          console.error('Failed to capture results:', err);
          alert('❌ Failed to capture results. Please try again.');
        },
      });
  }

  onCaptureResultsClose(): void {
    this.showCaptureDialog.set(false);
  }

  getCurrentSessionPlayer(): any {
    // Return first player or undefined
    // In a real scenario, we'd need to track which player this is
    return this.players().length > 0 ? this.players()[0] : undefined;
  }

  onExtendSession(): void {
    this.currentSessionData = this.timeoutAlertService.timeoutSessionData();
    this.showExtendDialog.set(true);
  }

  submitExtendSession(): void {
    const sessionId = this.currentSessionData?.sessionId;
    const additionalMinsStr = this.extendDurationMins();
    const additionalMinutes = parseInt(additionalMinsStr, 10);

    if (!sessionId || !additionalMinutes || additionalMinutes <= 0) {
      alert('Please select a valid duration');
      return;
    }

    this.http
      .post(`${this.apiUrl}/api/gaming-sessions/${sessionId}/extend`, {
        additionalMins: additionalMinutes,
      })
      .subscribe({
        next: () => {
          alert('✅ Session extended successfully!');
          this.closeExtendDialog();
          this.onDismiss();
        },
        error: (err) => {
          console.error('Failed to extend session:', err);
          alert('❌ Failed to extend session. Please try again.');
        },
      });
  }

  closeExtendDialog(): void {
    this.showExtendDialog.set(false);
    this.extendDurationMins.set('30');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
