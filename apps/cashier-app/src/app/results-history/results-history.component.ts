import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '@org/fe/auth';

interface SessionResult {
  id: string;
  sessionId: string;
  storeId: string;
  storeName?: string;
  playerEmail?: string;
  playerCellphone?: string;
  game?: string;
  score?: number;
  placement?: number;
  result?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  createdAt: Date;
  updatedAt: Date;
  sessionStartedAt?: Date;
  sessionEndedAt?: Date;
  durationMins?: number;
  ratePerHour?: string;
  gameType?: 'solo' | 'vs';
  opponentUserId?: string;
  opponentEmail?: string;
  opponentCellphone?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
}

@Component({
  selector: 'app-results-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
              <h1 class="text-2xl font-bold text-white">Results History</h1>
              <p class="text-slate-400 text-sm">Captured game results and session records</p>
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
            <div class="text-center space-y-4">
              <!-- Spinner -->
              <div class="flex justify-center">
                <div class="relative w-16 h-16">
                  <div class="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <!-- Loading Text -->
              <div>
                <p class="text-white font-semibold text-lg">Loading Results History</p>
                <p class="text-slate-400 text-sm mt-2">Fetching your captured results...</p>
              </div>
              <!-- Progress Dots -->
              <div class="flex justify-center gap-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
              </div>
            </div>
          </div>
        } @else if (sessionResults().length === 0) {
          <div class="flex flex-col items-center justify-center min-h-96 text-center">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-2xl font-bold text-white mb-2">No Results Yet</h3>
            <p class="text-slate-400 mb-6">Captured results will appear here</p>
            <button
              (click)="goBack()"
              class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        } @else {
          <div class="space-y-6">
            <!-- Filter Section -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-white/10 p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Player Filter -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Player</label>
                  <input
                    type="text"
                    [(ngModel)]="filterPlayer"
                    (ngModelChange)="currentPage.set(1)"
                    placeholder="Email or cellphone..."
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <!-- Game Filter -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Game</label>
                  <input
                    type="text"
                    [(ngModel)]="filterGame"
                    (ngModelChange)="currentPage.set(1)"
                    placeholder="Game name..."
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <!-- Score Filter -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Score</label>
                  <input
                    type="text"
                    [(ngModel)]="filterScore"
                    (ngModelChange)="currentPage.set(1)"
                    placeholder="Exact score..."
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <!-- Results Grid -->
            <div class="grid gap-4">
              @for (result of paginatedResults(); track result.id) {
              <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-white/10 p-6 hover:border-blue-400/50 transition-all">
                <div class="space-y-4">
                  <!-- Date/Time and Player -->
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-slate-400 text-sm">{{ result.createdAt | date: 'yyyy/MM/dd HH:mm' }}</p>
                      <p class="text-slate-500 text-xs mt-1">Player: {{ result.playerEmail || result.playerCellphone || 'Unknown' }}</p>
                    </div>
                    <button
                      (click)="openEditDialog(result)"
                      [disabled]="isUpdating()"
                      class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-semibold"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <!-- Solo Game Display -->
                  @if (result.gameType !== 'vs') {
                    <div class="grid grid-cols-3 gap-4">
                      <!-- Game Name -->
                      <div>
                        <p class="text-slate-400 text-xs font-semibold mb-1">GAME</p>
                        <p class="text-white font-bold text-sm">{{ result.game || 'Not Set' }}</p>
                      </div>

                      <!-- Score -->
                      <div>
                        <p class="text-slate-400 text-xs font-semibold mb-1">SCORE</p>
                        @if (result.score !== null && result.score !== undefined) {
                          <p class="text-white font-bold text-sm">{{ result.score }}</p>
                        } @else {
                          <p class="text-slate-400 text-sm">-</p>
                        }
                      </div>

                      <!-- Result -->
                      <div>
                        <p class="text-slate-400 text-xs font-semibold mb-1">RESULT</p>
                        @if (result.result) {
                          <p [ngClass]="{
                            'text-green-400': result.result === 'win',
                            'text-red-400': result.result === 'loss',
                            'text-yellow-400': result.result === 'draw',
                            'text-white': !result.result
                          }" class="font-bold text-sm capitalize">{{ result.result }}</p>
                        } @else {
                          <p class="text-slate-400 text-sm">-</p>
                        }
                      </div>
                    </div>
                  }

                  <!-- VS Player Display -->
                  @if (result.gameType === 'vs') {
                    <div class="space-y-3">
                      <!-- Game Name -->
                      <div>
                        <p class="text-slate-400 text-xs font-semibold mb-1">GAME</p>
                        <p class="text-white font-bold text-sm">{{ result.game || 'Not Set' }}</p>
                      </div>

                      <!-- VS Score Display -->
                      <div class="flex items-center justify-between bg-slate-700/30 rounded-lg p-3 border border-white/5">
                        <!-- Player 1 -->
                        <div class="text-center">
                          <p class="text-slate-400 text-xs mb-1">You</p>
                          <p class="text-white font-bold text-lg">{{ result.player1Score || 0 }}</p>
                        </div>

                        <!-- VS -->
                        <div class="text-center">
                          <p class="text-slate-500 text-xs font-semibold">VS</p>
                          <p [ngClass]="{
                            'text-green-400': result.winner === 'player1',
                            'text-red-400': result.winner === 'player2',
                            'text-yellow-400': result.winner === 'draw',
                            'text-slate-400': !result.winner
                          }" class="text-xs font-semibold mt-1 capitalize">
                            {{ result.winner === 'player1' ? 'Won' : result.winner === 'player2' ? 'Lost' : result.winner === 'draw' ? 'Draw' : '-' }}
                          </p>
                        </div>

                        <!-- Player 2 -->
                        <div class="text-center">
                          <p class="text-slate-400 text-xs mb-1">Opponent</p>
                          <p class="text-white font-bold text-lg">{{ result.player2Score || 0 }}</p>
                        </div>
                      </div>

                      <!-- Opponent Info -->
                      <p class="text-slate-500 text-xs">Opponent: {{ result.opponentEmail || result.opponentCellphone || 'Unknown' }}</p>
                    </div>
                  }
                </div>
              </div>
            }
            </div>

            <!-- Pagination Controls -->
            <div class="flex items-center justify-between mt-8">
              <div class="text-slate-400 text-sm">
                Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), filteredResults().length) }} of {{ filteredResults().length }}
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
                      [class.bg-blue-600]="currentPage() === page"
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
        @if (editingResult()) {
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md">
              <div class="p-6 border-b border-white/10">
                <h2 class="text-2xl font-bold text-white">Edit Result</h2>
                <p class="text-slate-400 text-sm mt-2">{{ editingResult()?.game }} - {{ editingResult()?.createdAt | date: 'yyyy/MM/dd HH:mm' }}</p>
              </div>

              <div class="p-6 space-y-4">
                <!-- Game -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Game</label>
                  <input
                    type="text"
                    [(ngModel)]="editForm.game"
                    placeholder="Enter game name"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <!-- Score -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Score</label>
                  <input
                    type="number"
                    [(ngModel)]="editForm.score"
                    placeholder="Enter score"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <!-- Result -->
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Result</label>
                  <select
                    [(ngModel)]="editForm.result"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Select result...</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
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
                    class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-semibold"
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
export class ResultsHistoryComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  sessionResults = signal<SessionResult[]>([]);
  isLoading = signal(false);
  isUpdating = signal(false);
  editingResult = signal<SessionResult | null>(null);
  pageSize = signal(10);
  currentPage = signal(1);
  filterPlayer = signal('');
  filterGame = signal('');
  filterScore = signal('');

  filteredResults = computed(() => {
    const results = this.sessionResults();
    const playerFilter = this.filterPlayer().toLowerCase();
    const gameFilter = this.filterGame().toLowerCase();
    const scoreFilter = this.filterScore();

    return results.filter(result => {
      // For player filter, check both your player and opponent
      const playerMatch = !playerFilter ||
        (result.playerEmail?.toLowerCase().includes(playerFilter) ||
         result.playerCellphone?.includes(playerFilter) ||
         result.opponentEmail?.toLowerCase().includes(playerFilter) ||
         result.opponentCellphone?.includes(playerFilter));

      const gameMatch = !gameFilter ||
        result.game?.toLowerCase().includes(gameFilter);

      // For score filter, check both solo score and vs player scores
      const scoreMatch = !scoreFilter ||
        result.score?.toString() === scoreFilter ||
        result.player1Score?.toString() === scoreFilter ||
        result.player2Score?.toString() === scoreFilter;

      return playerMatch && gameMatch && scoreMatch;
    });
  });

  paginatedResults = computed(() => {
    const results = this.filteredResults();
    const pageSize = this.pageSize();
    const currentPage = this.currentPage();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return results.slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredResults().length / this.pageSize());
  });

  editForm = {
    game: '',
    score: null as number | null,
    result: '',
  };

  ngOnInit(): void {
    this.loadResultsHistory();
  }

  private loadResultsHistory(): void {
    this.isLoading.set(true);
    const storeId = this.authService.storeId();

    if (!storeId) {
      console.error('Store ID not available');
      this.isLoading.set(false);
      return;
    }

    // Get all sessions for the store to find results
    const url = `${this.apiUrl}/api/gaming-sessions/store/${storeId}`;

    this.http.get<{ data: any[]; success: boolean }>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const sessionIds = response.data.map(s => s.id);
          this.loadResults(sessionIds, response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sessions:', err);
        this.isLoading.set(false);
      },
    });
  }

  private loadResults(sessionIds: string[], sessions: any[]): void {
    const allResults: SessionResult[] = [];
    let loadedCount = 0;

    const finishLoading = () => {
      allResults.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.sessionResults.set(allResults);
    };

    sessionIds.forEach((sessionId, index) => {
      const url = `${this.apiUrl}/api/gaming-sessions/${sessionId}/results`;

      this.http.get<{ data: any; success: boolean }>(url).subscribe({
        next: (response) => {
          console.log(`Loading result for session ${sessionId}:`, response);
          if (response.success && response.data) {
            const session = sessions[index];
            const result: SessionResult = {
              id: response.data.id,
              sessionId: sessionId,
              storeId: session.storeId,
              game: response.data.game,
              score: response.data.score,
              placement: response.data.placement,
              result: response.data.result,
              kills: response.data.kills,
              deaths: response.data.deaths,
              assists: response.data.assists,
              createdAt: new Date(response.data.createdAt),
              updatedAt: new Date(response.data.updatedAt),
              sessionStartedAt: new Date(session.startedAt),
              sessionEndedAt: session.endedAt ? new Date(session.endedAt) : undefined,
              durationMins: session.durationMins,
              ratePerHour: session.ratePerHour,
              gameType: response.data.gameType || 'solo',
              opponentUserId: response.data.opponentUserId,
              player1Score: response.data.player1Score,
              player2Score: response.data.player2Score,
              winner: response.data.winner,
            };

            // Get player info
            this.http.get<{ data: any }>(
              `${this.apiUrl}/api/players/${session.userId}`
            ).subscribe({
              next: (playerResponse) => {
                if (playerResponse.data) {
                  result.playerEmail = playerResponse.data.email;
                  result.playerCellphone = playerResponse.data.cellphone;
                }

                // If vs player, load opponent info
                if (result.opponentUserId) {
                  this.http.get<{ data: any }>(
                    `${this.apiUrl}/api/players/${result.opponentUserId}`
                  ).subscribe({
                    next: (opponentResponse) => {
                      if (opponentResponse.data) {
                        result.opponentEmail = opponentResponse.data.email;
                        result.opponentCellphone = opponentResponse.data.cellphone;
                      }
                      allResults.push(result);
                      loadedCount++;
                      if (loadedCount === sessionIds.length) {
                        finishLoading();
                      }
                    },
                    error: () => {
                      allResults.push(result);
                      loadedCount++;
                      if (loadedCount === sessionIds.length) {
                        finishLoading();
                      }
                    },
                  });
                } else {
                  allResults.push(result);
                  loadedCount++;
                  if (loadedCount === sessionIds.length) {
                    finishLoading();
                  }
                }
              },
              error: () => {
                if (result.opponentUserId) {
                  this.http.get<{ data: any }>(
                    `${this.apiUrl}/api/players/${result.opponentUserId}`
                  ).subscribe({
                    next: (opponentResponse) => {
                      if (opponentResponse.data) {
                        result.opponentEmail = opponentResponse.data.email;
                        result.opponentCellphone = opponentResponse.data.cellphone;
                      }
                      allResults.push(result);
                      loadedCount++;
                      if (loadedCount === sessionIds.length) {
                        finishLoading();
                      }
                    },
                    error: () => {
                      allResults.push(result);
                      loadedCount++;
                      if (loadedCount === sessionIds.length) {
                        finishLoading();
                      }
                    },
                  });
                } else {
                  allResults.push(result);
                  loadedCount++;
                  if (loadedCount === sessionIds.length) {
                    finishLoading();
                  }
                }
              },
            });
          } else {
            loadedCount++;
            if (loadedCount === sessionIds.length) {
              finishLoading();
            }
          }
        },
        error: () => {
          loadedCount++;
          if (loadedCount === sessionIds.length) {
            finishLoading();
          }
        },
      });
    });
  }

  openEditDialog(result: SessionResult): void {
    this.editingResult.set(result);
    this.editForm = {
      game: result.game || '',
      score: result.score || null,
      result: result.result || '',
    };
  }

  closeEditDialog(): void {
    this.editingResult.set(null);
  }

  saveEditedResults(): void {
    const result = this.editingResult();
    if (!result) {
      console.warn('Missing result');
      return;
    }

    this.isUpdating.set(true);
    const payload: any = {
      game: this.editForm.game,
      result: this.editForm.result,
    };

    if (this.editForm.score !== null && this.editForm.score !== undefined) {
      payload.score = this.editForm.score;
    }

    this.http.put(
      `${this.apiUrl}/api/gaming-sessions/results/${result.id}`,
      payload
    ).subscribe({
      next: () => {
        console.log('Results updated successfully');
        this.isUpdating.set(false);
        this.editingResult.set(null);
        this.loadResultsHistory();
      },
      error: (err) => {
        console.error('Failed to update results:', err);
        this.isUpdating.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['']);
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
