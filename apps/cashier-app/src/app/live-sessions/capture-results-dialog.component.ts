import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CaptureResult {
  game: string;
  score: number;
  result: string;
  gameType?: 'solo' | 'vs';
  opponentUserId?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
}

interface Game {
  id: string;
  name: string;
}

interface Player {
  id: string;
  email?: string;
  cellphone?: string;
}

interface SessionPlayer {
  id: string;
  email?: string;
  cellphone?: string;
  name?: string;
}

@Component({
  selector: 'app-capture-results-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 w-full max-w-md shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⏱️</span>
            <h2 class="text-xl font-bold text-white">Capture Game Result</h2>
          </div>
          <button
            (click)="onClose()"
            type="button"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <span class="text-2xl">✕</span>
          </button>
        </div>

        <!-- Form Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Game Name Dropdown -->
          <div>
            <label for="game" class="block text-sm text-slate-300 mb-2">Game</label>
            <select
              id="game"
              [(ngModel)]="formData.game"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
            >
              <option value="">Select game...</option>
              @for (game of uniqueGames(); track game.id) {
                <option [value]="game.name">{{ game.name }}</option>
              }
            </select>
          </div>

          <!-- Game Type Toggle -->
          <div>
            <label class="block text-sm text-slate-300 mb-2">Game Type</label>
            <div class="flex gap-2">
              <button
                (click)="setGameType('solo')"
                [class.bg-cyan-600]="gameType() === 'solo'"
                [class.bg-slate-700/50]="gameType() !== 'solo'"
                class="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white transition-colors font-semibold"
              >
                Solo
              </button>
              <button
                (click)="setGameType('vs')"
                [class.bg-cyan-600]="gameType() === 'vs'"
                [class.bg-slate-700/50]="gameType() !== 'vs'"
                class="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white transition-colors font-semibold"
              >
                vs Player
              </button>
            </div>
          </div>

          <!-- Solo Game Fields -->
          @if (gameType() === 'solo') {
            <!-- Score -->
            <div>
              <label for="score" class="block text-sm text-slate-300 mb-2">Score</label>
              <div class="relative">
                <input
                  id="score"
                  [(ngModel)]="formData.score"
                  type="number"
                  class="w-full px-4 py-2 bg-slate-700/50 border border-cyan-400/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
                <button
                  (click)="clearScore()"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title="Clear score"
                >
                  <span class="text-lg">⊗</span>
                </button>
              </div>
            </div>

            <!-- Result Dropdown -->
            <div>
              <label for="result" class="block text-sm text-slate-300 mb-2">Result</label>
              <select
                id="result"
                [(ngModel)]="formData.result"
                class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
              >
                <option value="">Select result...</option>
                <option value="win">Win 🏆</option>
                <option value="loss">Loss 😔</option>
                <option value="draw">Draw 🤝</option>
              </select>
            </div>
          }

          <!-- VS Player Fields -->
          @if (gameType() === 'vs') {
            <!-- Opponent Player Selection -->
            <div>
              <label for="opponent" class="block text-sm text-slate-300 mb-2">Opponent Player</label>
              <select
                id="opponent"
                [(ngModel)]="formData.opponentUserId"
                class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
              >
                <option value="">Select opponent...</option>
                @for (player of players; track player.id) {
                  <option [value]="player.id">{{ player.email || player.cellphone }}</option>
                }
              </select>
            </div>

            <!-- Player 1 Score -->
            <div>
              <label for="player1Score" class="block text-sm text-slate-300 mb-2">{{ getPlayerName() }} Score</label>
              <input
                id="player1Score"
                [(ngModel)]="formData.player1Score"
                type="number"
                placeholder="0"
                class="w-full px-4 py-2 bg-slate-700/50 border border-cyan-400/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            <!-- Player 2 Score -->
            <div>
              <label for="player2Score" class="block text-sm text-slate-300 mb-2">Opponent Score</label>
              <input
                id="player2Score"
                [(ngModel)]="formData.player2Score"
                type="number"
                placeholder="0"
                class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
              />
            </div>

            <!-- Winner Selection -->
            <div>
              <label for="winner" class="block text-sm text-slate-300 mb-2">Result</label>
              <select
                id="winner"
                [(ngModel)]="formData.winner"
                class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none"
              >
                <option value="">Select result...</option>
                <option value="player1">{{ getPlayerName() }} Wins 🏆</option>
                <option value="player2">Opponent Wins 🏆</option>
                <option value="draw">Draw 🤝</option>
              </select>
            </div>
          }
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 p-6 border-t border-white/10">
          <button
            (click)="onClose()"
            type="button"
            class="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            (click)="onSave()"
            type="button"
            class="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span>⭐</span>
            <span>Save Result</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CaptureResultsDialogComponent {
  @Input() games: Game[] = [];
  @Input() players: Player[] = [];
  @Input() sessionPlayer?: SessionPlayer;
  @Output() save = new EventEmitter<CaptureResult>();
  @Output() closeDialog = new EventEmitter<void>();

  // Remove duplicate games by name
  uniqueGames = computed(() => {
    const seen = new Set<string>();
    return this.games.filter(game => {
      if (seen.has(game.name)) {
        return false;
      }
      seen.add(game.name);
      return true;
    });
  });

  getPlayerName(): string {
    if (!this.sessionPlayer) return 'Player';
    return this.sessionPlayer.email || this.sessionPlayer.cellphone || 'Player';
  }

  gameType = signal<'solo' | 'vs'>('solo');

  formData = {
    game: '',
    score: 0,
    result: '',
    gameType: 'solo' as 'solo' | 'vs',
    opponentUserId: '',
    player1Score: 0,
    player2Score: 0,
    winner: '',
  };

  setGameType(type: 'solo' | 'vs'): void {
    this.gameType.set(type);
    this.formData.gameType = type;

    // Reset form data when switching modes
    if (type === 'solo') {
      this.formData.opponentUserId = '';
      this.formData.player1Score = 0;
      this.formData.player2Score = 0;
      this.formData.winner = '';
      this.formData.result = ''; // Reset result for solo mode
    } else {
      this.formData.player1Score = 0;
      this.formData.player2Score = 0;
      this.formData.result = ''; // Reset result for vs mode, will use winner instead
    }
  }

  onSave(): void {
    // Validate required fields
    if (!this.formData.game) {
      alert('Please select a game');
      return;
    }

    if (this.gameType() === 'solo') {
      if (!this.formData.result) {
        alert('Please select a result (Win/Loss/Draw)');
        return;
      }

      const result: CaptureResult = {
        game: this.formData.game,
        score: this.formData.score || 0,
        result: this.formData.result,
        gameType: 'solo',
      };

      this.save.emit(result);
    } else {
      // VS mode validation
      if (!this.formData.opponentUserId) {
        alert('Please select an opponent player');
        return;
      }
      if (this.formData.player1Score === undefined || this.formData.player1Score === null) {
        alert('Please enter your score');
        return;
      }
      if (this.formData.player2Score === undefined || this.formData.player2Score === null) {
        alert('Please enter opponent score');
        return;
      }
      if (!this.formData.winner) {
        alert('Please select a result (winner)');
        return;
      }

      const result: CaptureResult = {
        game: this.formData.game,
        score: this.formData.player1Score,
        result: this.formData.winner,
        gameType: 'vs',
        opponentUserId: this.formData.opponentUserId,
        player1Score: this.formData.player1Score,
        player2Score: this.formData.player2Score,
        winner: this.formData.winner,
      };

      this.save.emit(result);
    }
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  clearScore(): void {
    this.formData.score = 0;
  }
}
