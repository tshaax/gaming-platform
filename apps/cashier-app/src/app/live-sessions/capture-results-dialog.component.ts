import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CaptureResult {
  game: string;
  score: number;
  placement: number;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
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

        <!-- Game Info -->
        <div class="px-6 pt-4 pb-2">
          <p class="text-slate-400 text-sm">{{ gameName }}</p>
        </div>

        <!-- Form Content -->
        <div class="px-6 py-4 space-y-4">
          <!-- Game Name -->
          <div>
            <label for="game" class="block text-sm text-slate-300 mb-2">Game Name</label>
            <input
              id="game"
              [(ngModel)]="formData.game"
              type="text"
              placeholder="Enter game name"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
            />
          </div>

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

          <!-- Placement -->
          <div>
            <label for="placement" class="block text-sm text-slate-300 mb-2">Placement</label>
            <input
              id="placement"
              [(ngModel)]="formData.placement"
              type="number"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
            />
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

          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label for="kills" class="block text-sm text-slate-300 mb-2">Kills</label>
              <input
                id="kills"
                [(ngModel)]="formData.kills"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label for="deaths" class="block text-sm text-slate-300 mb-2">Deaths</label>
              <input
                id="deaths"
                [(ngModel)]="formData.deaths"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label for="assists" class="block text-sm text-slate-300 mb-2">Assists</label>
              <input
                id="assists"
                [(ngModel)]="formData.assists"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
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
  @Input() gameName = 'Game Name';
  @Output() save = new EventEmitter<CaptureResult>();
  @Output() closeDialog = new EventEmitter<void>();

  formData = {
    game: '',
    score: 0,
    placement: 1,
    result: '',
    kills: 0,
    deaths: 0,
    assists: 0,
  };

  onSave(): void {
    this.save.emit(this.formData as CaptureResult);
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  clearScore(): void {
    this.formData.score = 0;
  }
}
