import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '@org/fe/auth';

interface GameResult {
  id: string;
  sessionId: string;
  game: string;
  score: number;
  result?: string;
  placement?: number;
  gameType?: 'solo' | 'vs';
  opponentUserId?: string;
  opponentName?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  playerName: string;
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
              <p class="text-slate-400 text-sm">Verify and confirm game results</p>
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
              <div class="flex justify-center">
                <div class="relative w-16 h-16">
                  <div class="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <p class="text-white font-semibold text-lg">Loading Results...</p>
              <p class="text-slate-400 text-sm">Fetching pending results for verification</p>
            </div>
          </div>
        } @else if (results().length === 0) {
          <div class="flex flex-col items-center justify-center min-h-96 text-center">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-2xl font-bold text-white mb-2">No Results Yet</h3>
            <p class="text-slate-400 mb-6">Results will appear here once gamers start playing</p>
            <button
              (click)="goBack()"
              class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        } @else {
          <div class="space-y-6">
            <!-- Status Overview - Only OCR-Captured Results -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-gradient-to-br from-orange-600/20 to-orange-700/10 border border-orange-500/30 rounded-lg p-4">
                <p class="text-orange-200 text-sm font-semibold">⏳ Pending Verification</p>
                <p class="text-white text-3xl font-bold">{{ pendingCount() }}</p>
                <p class="text-orange-300 text-xs mt-2">From gamer app (OCR)</p>
              </div>
              <div class="bg-gradient-to-br from-green-600/20 to-green-700/10 border border-green-500/30 rounded-lg p-4">
                <p class="text-green-200 text-sm font-semibold">✓ Approved</p>
                <p class="text-white text-3xl font-bold">{{ approvedCount() }}</p>
                <p class="text-green-300 text-xs mt-2">Verified results</p>
              </div>
              <div class="bg-gradient-to-br from-red-600/20 to-red-700/10 border border-red-500/30 rounded-lg p-4">
                <p class="text-red-200 text-sm font-semibold">✕ Rejected</p>
                <p class="text-white text-3xl font-bold">{{ rejectedCount() }}</p>
                <p class="text-red-300 text-xs mt-2">Rejected results</p>
              </div>
            </div>

            <!-- Filter Section -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-white/10 p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Player Name</label>
                  <input
                    type="text"
                    [value]="filterPlayer()"
                    (input)="filterPlayer.set($any($event).target.value); currentPage.set(1)"
                    placeholder="Filter by player..."
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Game Name</label>
                  <input
                    type="text"
                    [value]="filterGame()"
                    (input)="filterGame.set($any($event).target.value); currentPage.set(1)"
                    placeholder="Filter by game..."
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    [value]="filterStatus()"
                    (change)="filterStatus.set($any($event).target.value); currentPage.set(1)"
                    class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Pending Verification Section -->
            @if (pendingCount() > 0) {
              <div class="mb-8">
                <h3 class="text-lg font-bold text-white mb-4">⏳ Pending Verification (from Gamer App)</h3>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-white/10">
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Player</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Game</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Result</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (result of filteredResults(); track result.id) {
                        @if (result.verificationStatus === 'pending') {
                          <tr class="border-b border-white/5 hover:bg-orange-600/10 transition-colors">
                            <td class="px-4 py-3 text-sm text-white">{{ result.playerName }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ result.game }}</td>
                            <td class="px-4 py-3 text-sm text-white font-semibold">{{ result.score }}</td>
                            <td class="px-4 py-3 text-sm">
                              @switch (result.result) {
                                @case ('win') {
                                  <span class="text-green-400 font-semibold">🏆 Win</span>
                                }
                                @case ('loss') {
                                  <span class="text-red-400 font-semibold">😔 Loss</span>
                                }
                                @case ('draw') {
                                  <span class="text-yellow-400 font-semibold">🤝 Draw</span>
                                }
                                @default {
                                  <span class="text-slate-400">-</span>
                                }
                              }
                            </td>
                            <td class="px-4 py-3 text-xs text-slate-400">{{ result.createdAt | date: 'short' }}</td>
                            <td class="px-4 py-3 text-sm">
                              <button
                                (click)="openVerifyDialog(result)"
                                [disabled]="isUpdating()"
                                class="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white rounded-lg transition-colors text-xs font-semibold"
                              >
                                Verify
                              </button>
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- All Results Section -->
            <div>
              <h3 class="text-lg font-bold text-white mb-4">📊 All Results</h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Player</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Game</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Opponent</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Result</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (result of filteredResults(); track result.id) {
                      <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="px-4 py-3 text-sm text-white">{{ result.playerName }}</td>
                        <td class="px-4 py-3 text-sm text-white">{{ result.game }}</td>
                        <td class="px-4 py-3 text-sm text-white font-semibold">
                          @if (result.gameType === 'vs') {
                            {{ result.player1Score }} - {{ result.player2Score }}
                          } @else {
                            {{ result.score }}
                          }
                        </td>
                        <td class="px-4 py-3 text-sm text-white">
                          @if (result.gameType === 'vs' && result.opponentName) {
                            {{ result.opponentName }}
                          } @else {
                            <span class="text-slate-400">-</span>
                          }
                        </td>
                        <td class="px-4 py-3 text-sm">
                          @switch (result.result) {
                            @case ('win') {
                              <span class="text-green-400 font-semibold">🏆 Win</span>
                            }
                            @case ('loss') {
                              <span class="text-red-400 font-semibold">😔 Loss</span>
                            }
                            @case ('draw') {
                              <span class="text-yellow-400 font-semibold">🤝 Draw</span>
                            }
                            @default {
                              <span class="text-slate-400">-</span>
                            }
                          }
                        </td>
                        <td class="px-4 py-3 text-sm">
                          @switch (result.verificationStatus) {
                            @case ('pending') {
                              <span class="px-3 py-1 bg-orange-600/30 text-orange-200 rounded-full text-xs font-semibold">⏳ Pending</span>
                            }
                            @case ('approved') {
                              <span class="px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-xs font-semibold">✓ Approved</span>
                            }
                            @case ('rejected') {
                              <span class="px-3 py-1 bg-red-600/30 text-red-200 rounded-full text-xs font-semibold">✕ Rejected</span>
                            }
                          }
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-400">{{ result.createdAt | date: 'short' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination Controls -->
              <div class="flex items-center justify-between mt-4 px-4 py-3 bg-slate-800/50 rounded-lg">
                <div class="text-sm text-slate-300">
                  Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), totalFilteredResults()) }} of {{ totalFilteredResults() }} results
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="currentPage.set(Math.max(1, currentPage() - 1))"
                    [disabled]="currentPage() === 1"
                    class="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm"
                  >
                    ← Previous
                  </button>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-slate-300">Page {{ currentPage() }} of {{ totalPages() }}</span>
                  </div>
                  <button
                    (click)="currentPage.set(Math.min(totalPages(), currentPage() + 1))"
                    [disabled]="currentPage() >= totalPages()"
                    class="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm"
                  >
                    Next →
                  </button>
                  <select
                    [value]="pageSize()"
                    (change)="pageSize.set(Number($any($event).target.value)); currentPage.set(1)"
                    class="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        }
      </main>

      <!-- Verify Dialog -->
      @if (showVerifyDialog()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 max-w-md w-full p-6 shadow-2xl">
            <h2 class="text-xl font-bold text-white mb-4">Verify Result</h2>

            @if (selectedResult()) {
              <div class="space-y-4 mb-6">
                <div>
                  <p class="text-slate-400 text-sm">Player: <span class="text-white font-semibold">{{ selectedResult()?.playerName }}</span></p>
                  <p class="text-slate-400 text-sm">Game: <span class="text-white font-semibold">{{ selectedResult()?.game }}</span></p>
                  <p class="text-slate-400 text-sm">Score: <span class="text-white font-semibold">{{ selectedResult()?.score }}</span></p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Verification Notes (Optional)</label>
                  <textarea
                    [(ngModel)]="verificationNotes"
                    placeholder="Add notes about this result verification..."
                    class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    rows="3"
                  ></textarea>
                </div>

                <div class="flex gap-2">
                  <button
                    (click)="approveResult()"
                    [disabled]="isUpdating()"
                    class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    (click)="rejectResult()"
                    [disabled]="isUpdating()"
                    class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            }

            <button
              (click)="closeVerifyDialog()"
              class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class ResultsHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  Math = Math;
  Number = Number;

  results = signal<GameResult[]>([]);
  isLoading = signal(true);
  isUpdating = signal(false);
  showVerifyDialog = signal(false);
  selectedResult = signal<GameResult | null>(null);
  verificationNotes = '';

  filterPlayer = signal('');
  filterGame = signal('');
  filterStatus = signal('');
  currentPage = signal(1);
  pageSize = signal(10);

  pendingCount = computed(() => this.results().filter(r => r.verificationStatus === 'pending').length);
  approvedCount = computed(() => this.results().filter(r => r.verificationStatus === 'approved').length);
  rejectedCount = computed(() => this.results().filter(r => r.verificationStatus === 'rejected').length);

  filteredResults = computed(() => {
    const allFiltered = this.results().filter(result => {
      const playerMatch = !this.filterPlayer() || result.playerName.toLowerCase().includes(this.filterPlayer().toLowerCase());
      const gameMatch = !this.filterGame() || result.game.toLowerCase().includes(this.filterGame().toLowerCase());
      const statusMatch = !this.filterStatus() || result.verificationStatus === this.filterStatus();
      return playerMatch && gameMatch && statusMatch;
    });

    const startIdx = (this.currentPage() - 1) * this.pageSize();
    const endIdx = startIdx + this.pageSize();
    return allFiltered.slice(startIdx, endIdx);
  });

  totalFilteredResults = computed(() => {
    return this.results().filter(result => {
      const playerMatch = !this.filterPlayer() || result.playerName.toLowerCase().includes(this.filterPlayer().toLowerCase());
      const gameMatch = !this.filterGame() || result.game.toLowerCase().includes(this.filterGame().toLowerCase());
      const statusMatch = !this.filterStatus() || result.verificationStatus === this.filterStatus();
      return playerMatch && gameMatch && statusMatch;
    }).length;
  });

  totalPages = computed(() => Math.ceil(this.totalFilteredResults() / this.pageSize()));

  ngOnInit(): void {
    this.loadPendingResults();
  }

  private loadPendingResults(): void {
    this.isLoading.set(true);
    const storeId = this.authService.storeId();

    if (!storeId) {
      this.isLoading.set(false);
      return;
    }

    this.http
      .get<{ success: boolean; data: GameResult[] }>(
        `${this.apiUrl}/api/game-results/${storeId}`,
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.results.set(response.data);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load results:', err);
          this.isLoading.set(false);
        },
      });
  }

  openVerifyDialog(result: GameResult): void {
    this.selectedResult.set(result);
    this.verificationNotes = '';
    this.showVerifyDialog.set(true);
  }

  closeVerifyDialog(): void {
    this.showVerifyDialog.set(false);
    this.selectedResult.set(null);
    this.verificationNotes = '';
  }

  approveResult(): void {
    this.verifyResult(true);
  }

  rejectResult(): void {
    this.verifyResult(false);
  }

  private verifyResult(approved: boolean): void {
    const result = this.selectedResult();
    if (!result) return;

    this.isUpdating.set(true);

    this.http
      .put<{ success: boolean }>(
        `${this.apiUrl}/api/game-results/${result.id}/verify`,
        {
          approved,
          verificationNotes: this.verificationNotes,
          verifiedBy: this.authService.userId(),
        },
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPendingResults();
            this.closeVerifyDialog();
          }
          this.isUpdating.set(false);
        },
        error: (err) => {
          console.error('Failed to verify result:', err);
          alert('Failed to verify result');
          this.isUpdating.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/cashier']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
