import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

interface TopPlayer {
  playerUsername: string;
  totalPoints: number;
  rank: number;
  rankTier: string;
}

interface GameResult {
  id: string;
  playerUsername: string;
  game: string;
  score: string | null;
  pointsEarned: number | null;
  kills: number;
  deaths: number;
  assists: number;
  result: string;
  placement: number | null;
  createdAt: Date;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-950 text-white p-8">
      <!-- Header with sidebar -->
      <div class="flex gap-8">
        <!-- Sidebar -->
        <div class="w-64">
          <button
            (click)="navigateToDashboard()"
            class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition w-full"
          >
            <span class="text-xl">←</span>
            <span>Back to Dashboard</span>
          </button>

          <nav class="mt-8 space-y-2">
            <div
              class="px-4 py-3 bg-white/5 border-l-2 border-cyan-400 text-white flex items-center gap-3"
            >
              <span class="text-lg">📊</span>
              <span>Leaderboard</span>
            </div>
          </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Header -->
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="text-4xl font-bold mb-2">Leaderboard</h1>
              <p class="text-cyan-400">
                {{ totalResultsCount() }} game results recorded
              </p>
            </div>
            <button
              (click)="navigateToEvents()"
              class="px-6 py-2 bg-cyan-400 text-black rounded-lg font-bold hover:bg-cyan-300 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Result</span>
            </button>
          </div>

          <!-- Filters -->
          <div class="mb-8 flex gap-6 items-center">
            <!-- Store Selector -->
            <div class="w-48">
              <label class="block text-sm text-gray-400 mb-2">Store</label>
              <select
                [(ngModel)]="selectedStore"
                (change)="onStoreChange()"
                class="w-full px-3 py-2 bg-black/80 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
              >
                <option value="">All Stores</option>
                <option
                  *ngFor="let store of stores()"
                  [value]="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Game Filter Tabs -->
          <div class="flex gap-3 mb-8">
            <button
              *ngFor="let game of gameFilters()"
              (click)="selectGame(game)"
              [class.bg-cyan-400]="selectedGame() === game"
              [class.text-black]="selectedGame() === game"
              [class.text-gray-400]="selectedGame() !== game"
              [class.hover:text-white]="selectedGame() !== game"
              class="px-4 py-2 rounded-full font-semibold transition"
              [style]="
                selectedGame() !== game
                  ? 'background-color: rgba(255,255,255,0.05)'
                  : ''
              "
            >
              {{ game }}
            </button>
          </div>

          <!-- Content Grid -->
          <div class="grid grid-cols-3 gap-8">
            <!-- Top Players -->
            <div class="col-span-1 bg-gray-900/50 border border-white/10 rounded-lg p-6">
              <div class="flex items-center gap-2 mb-6">
                <span class="text-2xl">🏆</span>
                <h2 class="text-2xl font-bold">Top Players</h2>
              </div>

              <div class="space-y-4">
                <div
                  *ngFor="let player of topPlayers()"
                  class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold"
                    >
                      {{ player.rank }}
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold">{{ player.playerUsername }}</p>
                      <p
                        class="text-xs"
                        [style]="'color:' + getTierColor(player.rankTier)"
                      >
                        {{ player.rankTier }}
                      </p>
                    </div>
                  </div>
                  <p class="text-cyan-400 font-bold">
                    {{ player.totalPoints?.toLocaleString() ?? 0 }}
                  </p>
                </div>

                <div *ngIf="topPlayers().length === 0" class="text-gray-500 py-8 text-center">
                  No players found
                </div>
              </div>
            </div>

            <!-- Game Results Table -->
            <div class="col-span-2 bg-gray-900/50 border border-white/10 rounded-lg p-6">
              <h2 class="text-2xl font-bold mb-6">Game Results</h2>

              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        PLAYER
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        GAME
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        SCORE
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        K/D
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        PTS
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        RESULT
                      </th>
                      <th class="text-left py-3 px-4 text-gray-400 font-semibold">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let result of filteredResults(); let i = index"
                      class="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td class="py-4 px-4">{{ i + 1 }}</td>
                      <td class="py-4 px-4 font-semibold">
                        {{ result.playerUsername }}
                      </td>
                      <td class="py-4 px-4 text-gray-400">{{ result.game }}</td>
                      <td class="py-4 px-4">{{ result.score ?? '-' }}</td>
                      <td class="py-4 px-4">
                        {{ result.kills }}/{{ result.deaths }}
                      </td>
                      <td class="py-4 px-4 text-cyan-400">
                        +{{ result.pointsEarned ?? 0 }}
                      </td>
                      <td class="py-4 px-4">
                        <span
                          [class.text-green-400]="result.result === 'Win'"
                          [class.text-red-400]="result.result === 'Loss'"
                          [class.text-yellow-400]="result.result !== 'Win' && result.result !== 'Loss'"
                        >
                          {{ result.result }}
                        </span>
                      </td>
                      <td class="py-4 px-4">
                        <div class="flex gap-2">
                          <button
                            (click)="deleteResult(result.id)"
                            class="p-1 text-red-400 hover:text-red-300 transition"
                            title="Delete result"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  *ngIf="filteredResults().length === 0"
                  class="text-gray-500 py-12 text-center"
                >
                  No results found for the selected filters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Signals
  stores = signal<any[]>([]);
  gameResults = signal<GameResult[]>([]);
  topPlayersData = signal<TopPlayer[]>([]);
  selectedStore = '';
  selectedGame = signal('All');
  isLoading = signal(false);
  games = signal<string[]>([]);

  // Computed
  gameFilters = computed(() => {
    const gameList = this.games();
    return ['All', ...gameList];
  });

  filteredResults = computed(() => {
    let results = this.gameResults();

    if (this.selectedGame() !== 'All') {
      results = results.filter((r) => r.game === this.selectedGame());
    }

    return results;
  });

  topPlayers = computed(() => this.topPlayersData());

  totalResultsCount = computed(() => this.gameResults().length);

  ngOnInit() {
    this.loadStores();
    this.loadLeaderboardData();
    this.loadGames();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStores() {
    this.http
      .get<any>(`${environment.apiUrl}/api/stores`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stores.set(response.data || []);
        },
        error: (err) => console.error('Error loading stores:', err),
      });
  }

  private loadLeaderboardData() {
    this.isLoading.set(true);
    const storeId = this.selectedStore || 'all';
    const game = this.selectedGame() === 'All' ? 'all' : this.selectedGame();

    this.http
      .get<any>(
        `${environment.apiUrl}/api/leaderboard?storeId=${storeId}&game=${game}`,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.gameResults.set(response.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading leaderboard:', err);
          this.isLoading.set(false);
        },
      });

    this.loadTopPlayers(storeId, game);
  }

  private loadTopPlayers(storeId: string, game: string) {
    this.http
      .get<any>(
        `${environment.apiUrl}/api/leaderboard/top-players?storeId=${storeId}&game=${game}`,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.topPlayersData.set(response.data || []);
        },
        error: (err) => console.error('Error loading top players:', err),
      });
  }

  private loadGames() {
    this.http
      .get<any>(`${environment.apiUrl}/api/leaderboard/games`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.games.set(response.data || []);
        },
        error: (err) => console.error('Error loading games:', err),
      });
  }

  onStoreChange() {
    this.loadLeaderboardData();
  }

  selectGame(game: string) {
    this.selectedGame.set(game);
    this.loadLeaderboardData();
  }

  deleteResult(resultId: string) {
    if (confirm('Are you sure you want to delete this result?')) {
      this.http
        .delete<any>(`${environment.apiUrl}/api/leaderboard/${resultId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadLeaderboardData();
          },
          error: (err) => console.error('Error deleting result:', err),
        });
    }
  }

  navigateToEvents() {
    this.router.navigate(['/events']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      Legend: '#fbbf24',
      Master: '#a78bfa',
      Diamond: '#06b6d4',
      Platinum: '#c7d2fe',
      Gold: '#fcd34d',
    };
    return colors[tier] || '#9ca3af';
  }
}
