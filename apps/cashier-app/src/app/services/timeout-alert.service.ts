import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@org/fe/auth';
import { environment } from '../../environments/environment';

export interface SessionTimeoutData {
  playerName: string;
  stationName: string;
  cost: number;
  durationMins: number;
  sessionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TimeoutAlertService {
  showTimeoutAlert = signal(false);
  timeoutSessionData = signal<SessionTimeoutData | null>(null);
  private alertedSessions: Set<string> = new Set();
  private monitoringInterval: any;
  private stationMap = new Map<string, string>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    // Load stations first
    this.loadStations(() => {
      // Initial check
      this.checkForTimeoutSessions();

      // Check every 5 seconds
      this.monitoringInterval = setInterval(() => {
        this.checkForTimeoutSessions();
      }, 5000);
    });
  }

  private loadStations(callback: () => void): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      callback();
      return;
    }

    const apiUrl = environment.apiUrl;
    this.http.get<{ data: any[] }>(`${apiUrl}/api/gaming-sessions/stations/${storeId}`).subscribe({
      next: (response) => {
        response.data?.forEach((station) => {
          this.stationMap.set(station.id, station.name);
        });
        callback();
      },
      error: () => {
        callback();
      }
    });
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private checkForTimeoutSessions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    const apiUrl = environment.apiUrl;
    this.http.get<{ data: any[] }>(`${apiUrl}/api/gaming-sessions/store/${storeId}`).subscribe({
      next: (response) => {
        const activeSessions = response.data?.filter(s => s.status === 'active') || [];
        activeSessions.forEach(session => {
          const startedAt = new Date(session.startedAt);
          const now = new Date();
          const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);
          const remainingMinutes = Math.max(0, session.durationMins - elapsedMinutes);
          const timeLeft = `${remainingMinutes} min`;

          const isTimedOut = timeLeft === '0 min';
          const hasAlert = this.alertedSessions.has(session.id);

          if (isTimedOut && !hasAlert) {
            this.alertedSessions.add(session.id);
            const cost = (parseFloat(session.ratePerHour) / 60) * session.durationMins;

            // Fetch player info
            this.http.get<{ data: any }>(`${apiUrl}/api/players/${session.userId}`).subscribe({
              next: (playerResponse) => {
                const playerName = playerResponse.data?.email || playerResponse.data?.cellphone || 'Unknown Player';
                const stationName = this.stationMap.get(session.stationId) || 'Unknown Station';
                this.timeoutSessionData.set({
                  playerName,
                  stationName,
                  cost,
                  durationMins: session.durationMins,
                  sessionId: session.id,
                });
                this.showTimeoutAlert.set(true);
              },
              error: () => {
                // Fallback if player fetch fails
                const stationName = this.stationMap.get(session.stationId) || 'Unknown Station';
                this.timeoutSessionData.set({
                  playerName: 'Unknown Player',
                  stationName,
                  cost,
                  durationMins: session.durationMins,
                  sessionId: session.id,
                });
                this.showTimeoutAlert.set(true);
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to check for timeout sessions:', err);
      },
    });
  }

  dismissAlert(): void {
    this.showTimeoutAlert.set(false);
    this.timeoutSessionData.set(null);
  }

  markSessionAsAlerted(sessionId: string): void {
    this.alertedSessions.add(sessionId);
  }
}
