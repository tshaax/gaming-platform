import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '@org/fe/auth';

interface LeaderboardEntry {
  position: number;
  gamerId: string;
  registrationId: string;
  username: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
}

interface Event {
  id: string;
  title: string;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              (click)="goBack()"
              class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 class="text-2xl font-bold text-white">Event Leaderboards</h1>
              <p class="text-purple-200 text-sm">Compete with other players</p>
            </div>
          </div>
          <button
            (click)="logout()"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Events List -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="inline-block w-8 h-8 border-4 border-purple-300 border-t-white rounded-full animate-spin"></div>
          </div>
        } @else if (events().length === 0) {
          <div class="text-center py-12">
            <p class="text-purple-200 text-lg">No events available</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            @for (event of events(); track event.id) {
              <button
                (click)="selectEvent(event)"
                [class.ring-2]="selectedEvent()?.id === event.id"
                [class.ring-cyan-400]="selectedEvent()?.id === event.id"
                class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 p-6 hover:border-cyan-400/50 transition-all text-left"
              >
                <h3 class="text-xl font-bold text-white mb-2">{{ event.title }}</h3>
                <p class="text-slate-400 text-sm">Click to view leaderboard</p>
              </button>
            }
          </div>

          <!-- Leaderboard -->
          @if (selectedEvent()) {
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 p-8">
              <h2 class="text-2xl font-bold text-white mb-6">{{ selectedEvent()?.title }} - Leaderboard</h2>

              @if (leaderboardLoading()) {
                <div class="flex items-center justify-center py-12">
                  <div class="inline-block w-8 h-8 border-4 border-purple-300 border-t-white rounded-full animate-spin"></div>
                </div>
              } @else if (leaderboard().length === 0) {
                <div class="text-center py-12">
                  <p class="text-slate-400">No results yet for this event</p>
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-white/10">
                        <th class="px-4 py-3 text-left text-slate-300">Position</th>
                        <th class="px-4 py-3 text-left text-slate-300">Username</th>
                        <th class="px-4 py-3 text-center text-slate-300">Points</th>
                        <th class="px-4 py-3 text-center text-slate-300">Games</th>
                        <th class="px-4 py-3 text-center text-slate-300">Wins</th>
                        <th class="px-4 py-3 text-center text-slate-300">Draws</th>
                        <th class="px-4 py-3 text-center text-slate-300">Losses</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (entry of leaderboard(); track entry.registrationId) {
                        <tr
                          [class.bg-cyan-600/20]="entry.gamerId === currentPlayerId()"
                          [class.border-cyan-400/30]="entry.gamerId === currentPlayerId()"
                          class="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td class="px-4 py-3 font-bold text-white w-16">
                            @if (entry.position === 1) {
                              🥇 {{ entry.position }}
                            } @else if (entry.position === 2) {
                              🥈 {{ entry.position }}
                            } @else if (entry.position === 3) {
                              🥉 {{ entry.position }}
                            } @else {
                              {{ entry.position }}
                            }
                          </td>
                          <td class="px-4 py-3 text-slate-200">
                            {{ maskUsername(entry.username) }}
                            @if (entry.gamerId === currentPlayerId()) {
                              <span class="text-cyan-400 text-sm ml-2">(You)</span>
                            }
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="text-cyan-300 font-bold text-lg">{{ entry.points }}</span>
                          </td>
                          <td class="px-4 py-3 text-center text-slate-300">{{ entry.gamesPlayed }}</td>
                          <td class="px-4 py-3 text-center">
                            <span class="text-green-400">{{ entry.wins }}</span>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="text-yellow-400">{{ entry.draws }}</span>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="text-red-400">{{ entry.losses }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [],
})
export class LeaderboardComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  events = signal<Event[]>([]);
  leaderboard = signal<LeaderboardEntry[]>([]);
  selectedEvent = signal<Event | null>(null);
  isLoading = signal(false);
  leaderboardLoading = signal(false);
  currentPlayerId = signal<string | null>(null);

  ngOnInit(): void {
    this.currentPlayerId.set(this.authService.userId() || null);
    this.loadEvents();
  }

  private loadEvents(): void {
    this.isLoading.set(true);
    this.http.get<{ data: Event[]; success: boolean }>(`${this.apiUrl}/api/events`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.isLoading.set(false);
      },
    });
  }

  selectEvent(event: Event): void {
    this.selectedEvent.set(event);
    this.loadLeaderboard(event.id);
  }

  private loadLeaderboard(eventId: string): void {
    this.leaderboardLoading.set(true);
    this.http.get<{ data: LeaderboardEntry[]; success: boolean }>(
      `${this.apiUrl}/api/events/${eventId}/leaderboard`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.leaderboard.set(response.data);
        }
        this.leaderboardLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load leaderboard:', err);
        this.leaderboardLoading.set(false);
      },
    });
  }

  maskUsername(username: string): string {
    if (username.length <= 2) return username;
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    const middleLength = username.length - 2;
    const masked = '*'.repeat(middleLength);
    return firstChar + masked + lastChar;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        console.error('Logout failed');
      },
    });
  }
}
