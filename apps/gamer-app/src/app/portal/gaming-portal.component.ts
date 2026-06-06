import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OcrCaptureDialogComponent, CaptureResult } from './ocr-capture-dialog.component';

interface ActiveSession {
  id: string;
  storeId: string;
  storeName: string;
  stationName: string;
  game?: string;
  startedAt: Date;
  durationMins: number;
  ratePerHour: string;
}

interface Player {
  id: string;
  email?: string;
  cellphone?: string;
}

@Component({
  selector: 'app-gaming-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OcrCaptureDialogComponent],
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
              <h1 class="text-2xl font-bold text-white">{{ session()?.storeName }}</h1>
              <p class="text-purple-200 text-sm">Station: {{ session()?.stationName }}</p>
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

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Active Session Card -->
        @if (session()) {
          <div class="bg-gradient-to-br from-cyan-600/20 to-blue-700/20 backdrop-blur-md rounded-2xl p-8 border border-cyan-400/30 mb-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p class="text-cyan-200 text-sm mb-1">Started</p>
                <p class="text-white text-lg font-semibold">{{ session()?.startedAt | date: 'short' }}</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Duration</p>
                <p class="text-white text-lg font-semibold">{{ session()?.durationMins }} min</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Rate</p>
                <p class="text-white text-lg font-semibold">{{ '$' + (session()?.ratePerHour || '0') }}/hr</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Game</p>
                <p class="text-white text-lg font-semibold">{{ session()?.game || 'Not set' }}</p>
              </div>
            </div>
          </div>
        }

        <!-- Game Details Form -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-8 mb-8">
          <h2 class="text-2xl font-bold text-white mb-6">Game Details</h2>

          <form [formGroup]="gameForm" class="space-y-6">
            <!-- Game Name -->
            <div>
              <label for="gameName" class="block text-sm font-medium text-slate-300 mb-2">
                What game are you playing?
              </label>
              <input
                id="gameName"
                type="text"
                formControlName="gameName"
                placeholder="e.g., Counter-Strike 2, Valorant, League of Legends"
                class="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            <!-- CPU vs Opponent -->
            <div>
              <p class="block text-sm font-medium text-slate-300 mb-3">Playing Against</p>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    formControlName="opponentType"
                    value="cpu"
                    class="w-4 h-4"
                  />
                  <span class="text-white">CPU / Practice</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    formControlName="opponentType"
                    value="opponent"
                    class="w-4 h-4"
                  />
                  <span class="text-white">Other Player</span>
                </label>
              </div>
            </div>

            <!-- Opponent Selection -->
            @if (gameForm.get('opponentType')?.value === 'opponent') {
              <div>
                <label for="opponent" class="block text-sm font-medium text-slate-300 mb-2">
                  Select Opponent
                </label>
                <select
                  id="opponent"
                  formControlName="opponentUserId"
                  class="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                >
                  <option value="">Choose a player...</option>
                  @for (player of otherPlayers(); track player.id) {
                    <option [value]="player.id">
                      {{ player.email || player.cellphone || player.id }}
                    </option>
                  }
                </select>
              </div>
            }

            <!-- Save Details Button -->
            <button
              type="button"
              (click)="saveDetails()"
              [disabled]="isSavingDetails() || !gameForm.get('gameName')?.value"
              class="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              @if (isSavingDetails()) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              } @else {
                <span>💾</span>
                <span>Save Game Details</span>
              }
            </button>
          </form>
        </div>

        <!-- End Game Button -->
        <button
          type="button"
          (click)="startEndSession()"
          [disabled]="!gameForm.get('gameName')?.value || isSavingDetails()"
          class="w-full py-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-lg transition-all"
        >
          🏁 End Game & Capture Results
        </button>
      </main>

      <!-- OCR Capture Dialog -->
      @if (showOcrDialog()) {
        <app-ocr-capture-dialog
          [sessionGame]="session()?.game || 'Unknown Game'"
          (save)="submitResults($event)"
          (closeDialog)="closeOcrDialog()"
        />
      }
    </div>
  `,
  styles: [],
})
export class GamingPortalComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private apiUrl = environment.apiUrl;

  session = signal<ActiveSession | null>(null);
  otherPlayers = signal<Player[]>([]);
  isSavingDetails = signal(false);
  showOcrDialog = signal(false);
  isSubmitting = signal(false);

  gameForm: FormGroup;

  constructor() {
    this.gameForm = this.fb.group({
      gameName: ['', Validators.required],
      opponentType: ['cpu'],
      opponentUserId: [''],
    });
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    let sessionData = (navigation?.extras.state as any)?.session;

    if (!sessionData && (window.history.state as any)?.session) {
      sessionData = (window.history.state as any).session;
    }

    if (sessionData) {
      this.session.set(sessionData);
      this.gameForm.patchValue({ gameName: sessionData.game || '' });
      this.loadOtherPlayers(sessionData.storeId);
    } else {
      this.router.navigate(['/']);
    }
  }

  private loadOtherPlayers(storeId: string): void {
    this.http.get<{ data: Player[]; success: boolean }>(
      `${this.apiUrl}/api/players/store/${storeId}`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.otherPlayers.set(response.data);
        }
      },
      error: (err) => {
        console.error('Failed to load players:', err);
      },
    });
  }

  saveDetails(): void {
    if (!this.session() || !this.gameForm.valid) return;

    this.isSavingDetails.set(true);
    const payload = {
      game: this.gameForm.get('gameName')?.value,
      opponentUserId: this.gameForm.get('opponentUserId')?.value || null,
    };

    this.http.put(
      `${this.apiUrl}/api/gaming-sessions/${this.session()!.id}/details`,
      payload
    ).subscribe({
      next: () => {
        this.isSavingDetails.set(false);
        const updatedSession = { ...this.session()!, game: payload.game };
        this.session.set(updatedSession);
      },
      error: (err) => {
        console.error('Failed to save details:', err);
        this.isSavingDetails.set(false);
      },
    });
  }

  startEndSession(): void {
    this.showOcrDialog.set(true);
  }

  closeOcrDialog(): void {
    this.showOcrDialog.set(false);
  }

  submitResults(result: CaptureResult): void {
    if (!this.session()) return;

    this.isSubmitting.set(true);
    const payload = {
      game: result.game,
      score: result.score,
      placement: result.placement,
      result: result.result,
      kills: result.kills,
      deaths: result.deaths,
      assists: result.assists,
    };

    this.http.post(
      `${this.apiUrl}/api/gaming-sessions/${this.session()!.id}/results`,
      payload
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showOcrDialog.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Failed to submit results:', err);
        this.isSubmitting.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
