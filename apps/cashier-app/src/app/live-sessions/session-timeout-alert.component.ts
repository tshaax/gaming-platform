import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SessionTimeoutData {
  playerName: string;
  stationName: string;
  cost: number;
  durationMins: number;
  sessionId: string;
}

@Component({
  selector: 'app-session-timeout-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
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
                <span class="text-white font-semibold">{{ sessionData.playerName }}</span>
              </div>

              <!-- Station -->
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Station:</span>
                <span class="text-white font-semibold">{{ sessionData.stationName }}</span>
              </div>

              <!-- Duration -->
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Booked Duration:</span>
                <span class="text-white font-semibold">{{ sessionData.durationMins }} minutes</span>
              </div>

              <!-- Total Cost -->
              <div class="flex items-center justify-between pt-2 border-t border-red-400/20">
                <span class="text-slate-400 font-semibold">Total Cost:</span>
                <span class="text-red-300 font-bold text-lg">{{ formatCurrency(sessionData.cost) }}</span>
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
        <div class="flex gap-3 p-6 border-t border-red-400/30 bg-red-600/5">
          <button
            (click)="onDismiss()"
            type="button"
            class="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            (click)="onEndSession()"
            type="button"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all"
          >
            End Session Now
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class SessionTimeoutAlertComponent {
  @Input() sessionData!: SessionTimeoutData;
  @Output() dismiss = new EventEmitter<void>();
  @Output() endSession = new EventEmitter<string>();

  onDismiss(): void {
    this.dismiss.emit();
  }

  onEndSession(): void {
    this.endSession.emit(this.sessionData.sessionId);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
