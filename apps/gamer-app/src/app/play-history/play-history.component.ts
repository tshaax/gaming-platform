import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface CompletedSession {
  id: string;
  storeId: string;
  storeName?: string;
  game?: string;
  startedAt: Date;
  endedAt?: Date;
  durationMins: number;
  ratePerHour: string;
  eventId?: string;
  eventTitle?: string;
  result?: string;
  score?: number;
  placement?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  resultId?: string;
}

@Component({
  selector: 'app-play-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <h1 class="text-2xl font-bold text-white">Play History</h1>
              <p class="text-purple-200 text-sm">Your completed gaming sessions</p>
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
        @if (isLoading()) {
          <div class="flex items-center justify-center min-h-96">
            <div class="text-center">
              <div class="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-slate-300">Loading your play history...</p>
            </div>
          </div>
        } @else if (completedSessions().length === 0) {
          <div class="flex flex-col items-center justify-center min-h-96 text-center">
            <div class="text-6xl mb-4">🎮</div>
            <h3 class="text-2xl font-bold text-white mb-2">No Play History Yet</h3>
            <p class="text-slate-400 mb-6">Complete some gaming sessions to see your history here</p>
            <button
              (click)="goBack()"
              class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all"
            >
              Start Playing
            </button>
          </div>
        } @else {
          <div class="space-y-6">
            <!-- Sessions Grid -->
            <div class="grid gap-4">
              @for (session of paginatedSessions(); track session.id) {
              <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-white/10 p-6 hover:border-cyan-400/50 transition-all">
                <div class="space-y-4">
                  <!-- Date/Time -->
                  <p class="text-slate-400 text-sm">{{ session.startedAt | date: 'yyyy/MM/dd HH:mm' }}</p>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <!-- Game Name -->
                    <div>
                      <p class="text-slate-400 text-xs font-semibold mb-1">GAME</p>
                      <p class="text-white font-bold text-lg">{{ session.game || 'Not Set' }}</p>
                    </div>

                    <!-- Score -->
                    <div>
                      <p class="text-slate-400 text-xs font-semibold mb-1">SCORE</p>
                      @if (session.score !== null && session.score !== undefined) {
                        <p class="text-white font-bold text-lg">{{ session.score }}</p>
                      } @else {
                        <p class="text-slate-400 text-lg">-</p>
                      }
                    </div>

                    <!-- Result -->
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-slate-400 text-xs font-semibold mb-1">RESULT</p>
                        @if (session.result) {
                          <p [ngClass]="{
                            'text-green-400': session.result === 'win',
                            'text-red-400': session.result === 'loss',
                            'text-yellow-400': session.result === 'draw',
                            'text-white': !session.result
                          }" class="font-bold text-lg capitalize">{{ session.result }}</p>
                        } @else {
                          <p class="text-slate-400 text-lg">No results</p>
                        }
                      </div>

                      <!-- Edit Button - Only show when no results -->
                      @if (!session.result) {
                        <button
                          (click)="openEditDialog(session)"
                          [disabled]="isUpdating()"
                          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-semibold self-end"
                        >
                          ✏️ Edit
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
            </div>

            <!-- Pagination Controls -->
            <div class="flex items-center justify-between mt-8">
              <div class="text-slate-400 text-sm">
                Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), completedSessions().length) }} of {{ completedSessions().length }}
              </div>
              <div class="flex gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors font-semibold"
                >
                  ← Previous
                </button>
                <div class="flex items-center gap-2">
                  @for (page of getPageNumbers(); track page) {
                    <button
                      (click)="goToPage(page)"
                      [class.bg-cyan-600]="currentPage() === page"
                      [class.bg-slate-700]="currentPage() !== page"
                      [class.text-white]="currentPage() === page"
                      [class.text-slate-300]="currentPage() !== page"
                      class="px-3 py-2 rounded-lg transition-colors font-semibold hover:bg-slate-600"
                    >
                      {{ page }}
                    </button>
                  }
                </div>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Edit Results Dialog -->
        @if (editingSession()) {
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md">
              <div class="p-6 border-b border-white/10">
                <h2 class="text-2xl font-bold text-white">Edit Results</h2>
                <p class="text-slate-400 text-sm mt-2">{{ editingSession()?.game }} - {{ editingSession()?.startedAt | date: 'yyyy/MM/dd HH:mm' }}</p>
              </div>

              <div class="p-6 space-y-4">
                <!-- Game Selection - Only show if game is not set -->
                @if (!editingSession()?.game) {
                  <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2">Game</label>
                    <select
                      [(ngModel)]="editForm.game"
                      class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Select a game...</option>
                      @for (game of games(); track game.id) {
                        <option [value]="game.name">{{ game.name }}</option>
                      }
                    </select>
                  </div>
                }

                <!-- Result -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Result</label>
                  <select
                    [(ngModel)]="editForm.result"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Select result...</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>

                <!-- Score -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Score</label>
                  <input
                    type="number"
                    [(ngModel)]="editForm.score"
                    placeholder="Enter score"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <!-- Buttons -->
                <div class="flex gap-3 pt-4">
                  <button
                    (click)="closeEditDialog()"
                    class="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    (click)="saveEditedResults()"
                    [disabled]="isUpdating()"
                    class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    {{ isUpdating() ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [],
})
export class PlayHistoryComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  completedSessions = signal<CompletedSession[]>([]);
  isLoading = signal(false);
  isUpdating = signal(false);
  editingSession = signal<CompletedSession | null>(null);
  pageSize = signal(10);
  currentPage = signal(1);
  games = signal<{ id: string; name: string }[]>([]);

  paginatedSessions = computed(() => {
    const sessions = this.completedSessions();
    const pageSize = this.pageSize();
    const currentPage = this.currentPage();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sessions.slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    return Math.ceil(this.completedSessions().length / this.pageSize());
  });

  editForm = {
    game: '',
    result: '',
    score: null as number | null,
  };

  ngOnInit(): void {
    this.loadPlayHistory();
  }

  private loadGames(): void {
    const sessions = this.completedSessions();
    if (sessions.length === 0) return;

    const uniqueStoreIds = Array.from(new Set(sessions.map(s => s.storeId)));
    const allGames: { id: string; name: string }[] = [];

    uniqueStoreIds.forEach(storeId => {
      const url = `${this.apiUrl}/api/gaming-sessions/games/${storeId}`;
      this.http.get<{ data: { id: string; name: string }[]; success: boolean }>(url).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            allGames.push(...response.data);
            // Remove duplicates by game name
            const uniqueGames = Array.from(
              new Map(allGames.map(g => [g.name, g])).values()
            );
            this.games.set(uniqueGames);
          }
        },
        error: (err) => {
          console.error(`Failed to load games for store ${storeId}:`, err);
        },
      });
    });
  }

  private loadPlayHistory(): void {
    this.isLoading.set(true);
    const url = `${this.apiUrl}/api/gaming-sessions/user`;

    this.http.get<{ data: CompletedSession[]; success: boolean }>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const completedSessions = response.data.filter(s => s.endedAt && new Date(s.endedAt) < new Date());
          completedSessions.sort((a, b) => new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime());
          this.completedSessions.set(completedSessions);
          // Load games after sessions are loaded
          this.loadGames();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load play history:', err);
        this.isLoading.set(false);
      },
    });
  }

  openEditDialog(session: CompletedSession): void {
    this.editingSession.set(session);
    this.editForm = {
      game: session.game || '',
      result: session.result || '',
      score: session.score || null,
    };
  }

  closeEditDialog(): void {
    this.editingSession.set(null);
  }

  private updateSessionGameInUI(sessionId: string, game: string): void {
    const sessions = this.completedSessions();
    const updatedSessions = sessions.map(s =>
      s.id === sessionId ? { ...s, game } : s
    );
    this.completedSessions.set(updatedSessions);
    console.log('Updated session game in UI:', sessionId, game);
  }

  saveEditedResults(): void {
    const session = this.editingSession();
    if (!session) {
      console.warn('Missing session');
      return;
    }

    // Validate that at least game is set
    const gameToSave = this.editForm.game || session.game;
    if (!gameToSave) {
      console.warn('Game is required');
      alert('Please select a game');
      return;
    }

    this.isUpdating.set(true);
    const payload: any = {
      game: gameToSave,
    };

    // Only include result if it has a value
    if (this.editForm.result) {
      payload.result = this.editForm.result;
    }

    // Only include score if it has a value
    if (this.editForm.score !== null && this.editForm.score !== undefined) {
      payload.score = this.editForm.score;
    }

    console.log('Saving results with payload:', payload);
    console.log('Session ID:', session.id);
    console.log('Result ID:', session.resultId);

    // If resultId exists, update the result; otherwise create a new one
    if (session.resultId) {
      // Update existing result
      this.http.put(
        `${this.apiUrl}/api/gaming-sessions/results/${session.resultId}`,
        payload
      ).subscribe({
        next: (response) => {
          console.log('Results updated successfully:', response);
          this.isUpdating.set(false);
          this.editingSession.set(null);
          this.updateSessionGameInUI(session.id, gameToSave);
          this.loadPlayHistory();
        },
        error: (err) => {
          console.error('Failed to update results:', err);
          console.error('Error details:', err.error || err.message);
          this.isUpdating.set(false);
        },
      });
    } else {
      // Create new result
      this.http.post(
        `${this.apiUrl}/api/gaming-sessions/${session.id}/results`,
        payload
      ).subscribe({
        next: (response) => {
          console.log('Results created successfully:', response);
          this.isUpdating.set(false);
          this.editingSession.set(null);
          this.updateSessionGameInUI(session.id, gameToSave);
          this.loadPlayHistory();
        },
        error: (err) => {
          console.error('Failed to create results:', err);
          console.error('Error details:', err.error || err.message);
          this.isUpdating.set(false);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    for (let i = 1; i <= total; i++) {
      // Show first 3 pages, last page, and current page with neighbors
      if (i <= 3 || i === total || (i >= current - 1 && i <= current + 1)) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  protected readonly Math = Math;
}
