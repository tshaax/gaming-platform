import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Store {
  id: string;
  name: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <!-- Left Sidebar -->
      <aside [class.w-64]="sidebarOpen()" [class.w-20]="!sidebarOpen()" class="bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col transition-all duration-300">
        <!-- Toggle Button and Logo -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <button (click)="sidebarOpen.set(!sidebarOpen())" class="text-white hover:text-cyan-400 transition-colors p-2">
              <span class="text-2xl">☰</span>
            </button>
          </div>
          @if (sidebarOpen()) {
            <img src="/playground-logo.png" alt="Playground Logo" class="w-full h-auto" />
          }
        </div>

        <!-- Store Info -->
        @if (sidebarOpen()) {
          <div class="mb-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
            <p class="text-slate-400 text-xs font-semibold uppercase">Store</p>
            <p class="text-white font-bold text-sm">{{ storeName() || 'Loading...' }}</p>
          </div>
        }

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-2">
          <div class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3 cursor-pointer">
            <span class="text-lg">🛒</span>
            @if (sidebarOpen()) {
              <span>POS</span>
            }
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🔗</span>
            @if (sidebarOpen()) {
              <span>Live Sessions</span>
            }
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">📊</span>
            @if (sidebarOpen()) {
              <span>Reports</span>
            }
          </div>
        </nav>

        <!-- Logout Button with Username -->
        <button
          (click)="logout()"
          class="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 font-semibold flex items-center gap-3 transition-colors"
        >
          <span class="text-lg">🚪</span>
          @if (sidebarOpen()) {
            <span class="text-left">
              <div class="text-xs text-red-300">{{ userEmail() }}</div>
              <div>Logout</div>
            </span>
          }
        </button>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Top Header -->
        <header class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Point of Sale</h1>
            <p class="text-slate-400 text-sm">Select an action to get started</p>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-green-400 text-sm font-semibold">● Live Sessions</span>
          </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-auto flex flex-col">
          <!-- Action Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <!-- Gaming Session -->
            <div (click)="showGamingSessionModal.set(true)" class="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 backdrop-blur-md rounded-xl p-8 border border-cyan-400/30 hover:border-cyan-400/70 transition-all cursor-pointer group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-4xl group-hover:scale-110 transition-transform">▶️</span>
                <span class="text-cyan-400 text-sm font-semibold">→</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Gaming Session</h3>
              <p class="text-cyan-200 text-sm">Book a station for a player — pick game, duration & rate</p>
            </div>

            <!-- League & Competition -->
            <div class="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-md rounded-xl p-8 border border-purple-400/30 hover:border-purple-400/70 transition-all cursor-pointer group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-4xl group-hover:scale-110 transition-transform">🏆</span>
                <span class="text-purple-400 text-sm font-semibold">→</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">League & Competition</h3>
              <p class="text-purple-200 text-sm">Register a player into an upcoming tournament or league event</p>
            </div>

            <!-- Apply Promotion -->
            <div class="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-md rounded-xl p-8 border border-orange-400/30 hover:border-orange-400/70 transition-all cursor-pointer group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-4xl group-hover:scale-110 transition-transform">🎁</span>
                <span class="text-orange-400 text-sm font-semibold">→</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Apply Promotion</h3>
              <p class="text-orange-200 text-sm">Look up and redeem an active promo code or discount</p>
            </div>
          </div>
        </div>
      </main>

      <!-- New Gaming Session Modal -->
      @if (showGamingSessionModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-2xl text-cyan-400">▶</span>
                <h2 class="text-2xl font-bold text-white">New Gaming Session</h2>
              </div>
              <button (click)="showGamingSessionModal.set(false)" class="text-white hover:text-cyan-400 text-2xl">✕</button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="gamingSessionForm" (ngSubmit)="startSession()" class="p-6 space-y-6">
              <!-- Player -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                  <span>👤</span>
                  <span>Player</span>
                </label>
                <input
                  type="text"
                  formControlName="playerSearch"
                  placeholder="Select or search player..."
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <!-- Opponent Type -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                  <span>🎮</span>
                  <span>Opponent Type</span>
                </label>
                <select
                  formControlName="opponentType"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">Select opponent type...</option>
                  <option value="single">Single Player</option>
                  <option value="multiplayer">Multiplayer</option>
                  <option value="tournament">Tournament</option>
                </select>
              </div>

              <!-- Station -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                  <span>🖥️</span>
                  <span>Station</span>
                </label>
                <select
                  formControlName="station"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">Select station...</option>
                  <option value="station1">Station 1</option>
                  <option value="station2">Station 2</option>
                  <option value="station3">Station 3</option>
                </select>
              </div>

              <!-- Duration and Rate Row -->
              <div class="grid grid-cols-2 gap-6">
                <!-- Duration -->
                <div>
                  <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                    <span>⏱️</span>
                    <span>Duration</span>
                  </label>
                  <select
                    formControlName="duration"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">60 min</option>
                    <option value="30">30 min</option>
                    <option value="60">60 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>

                <!-- Rate -->
                <div>
                  <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                    <span>💰</span>
                    <span>Rate/hr ($)</span>
                  </label>
                  <input
                    type="number"
                    formControlName="rate"
                    placeholder="10.00"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
                  <span>📝</span>
                  <span>Notes (optional)</span>
                </label>
                <textarea
                  formControlName="notes"
                  placeholder="Any notes..."
                  rows="3"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 resize-none"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <button
                type="submit"
                class="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span class="text-lg">▶</span>
                <span>Start Session</span>
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class LandingComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  storeName = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  sidebarOpen = signal(true);
  showGamingSessionModal = signal(false);
  gamingSessionForm: FormGroup;

  constructor() {
    this.gamingSessionForm = this.fb.group({
      playerSearch: ['', Validators.required],
      opponentType: ['', Validators.required],
      station: ['', Validators.required],
      duration: ['60', Validators.required],
      rate: ['10.00', Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadStoreName();
    this.userEmail.set(this.authService.user().email || this.authService.user().cellphone || 'User');
  }

  private loadStoreName(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      this.storeName.set('Unknown Store');
      return;
    }

    this.http.get<{ data: Store }>(`http://localhost:3333/api/stores/${storeId}`).subscribe({
      next: (response) => {
        this.storeName.set(response.data.name);
      },
      error: () => {
        this.storeName.set('Unknown Store');
      },
    });
  }

  startSession(): void {
    if (!this.gamingSessionForm.valid) {
      console.error('Form is invalid');
      return;
    }

    const formData = this.gamingSessionForm.value;
    console.log('Starting gaming session:', formData);

    // Reset form and close modal
    this.gamingSessionForm.reset({ duration: '60', rate: '10.00' });
    this.showGamingSessionModal.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
