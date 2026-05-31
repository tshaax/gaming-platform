import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

interface Store {
  id: string;
  name: string;
}

interface GamingStation {
  id: string;
  name: string;
  isActive: boolean;
}

interface DurationOption {
  id: string;
  minutes: number;
  isActive: boolean;
}

interface RateOption {
  id: string;
  ratePerHour: number;
  label: string;
  isActive: boolean;
}

interface Player {
  id: string;
  email?: string;
  cellphone?: string;
}

interface Event {
  id: string;
  title: string;
  game?: string;
  eventType?: string;
  startDate: string;
  status: string;
}

interface Promotion {
  id: string;
  title: string;
  type: string;
  promoCode: string;
  discountValue?: number;
  status: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <!-- Left Sidebar -->
      <aside [class.w-64]="sidebarOpen()" [class.w-20]="!sidebarOpen()" class="bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col transition-all duration-300">
        <!-- Toggle Button -->
        <div class="mb-8">
          <button (click)="sidebarOpen.set(!sidebarOpen())" class="text-white hover:text-cyan-400 transition-colors p-2">
            <span class="text-2xl">☰</span>
          </button>
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
          <div (click)="router.navigate(['/live-sessions'])" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🔗</span>
            @if (sidebarOpen()) {
              <span>Live Sessions</span>
            }
          </div>
          <div (click)="router.navigate(['/reports'])" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
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
          <div class="flex items-center gap-4">
            <img src="/playground-logo.png" alt="Playground Logo" class="h-12 w-auto" />
            <div>
              <h1 class="text-3xl font-bold text-white">Point of Sale</h1>
              <p class="text-slate-400 text-sm">Select an action to get started</p>
            </div>
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
            <div (click)="showLeagueModal.set(true)" class="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-md rounded-xl p-8 border border-purple-400/30 hover:border-purple-400/70 transition-all cursor-pointer group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-4xl group-hover:scale-110 transition-transform">🏆</span>
                <span class="text-purple-400 text-sm font-semibold">→</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">League & Competition</h3>
              <p class="text-purple-200 text-sm">Register a player into an upcoming tournament or league event</p>
            </div>

            <!-- Apply Promotion -->
            <div (click)="showPromotionModal.set(true)" class="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-md rounded-xl p-8 border border-orange-400/30 hover:border-orange-400/70 transition-all cursor-pointer group">
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
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-xl text-cyan-400">▶</span>
                <h2 class="text-xl font-bold text-white">New Gaming Session</h2>
              </div>
              <button (click)="showGamingSessionModal.set(false)" class="text-white hover:text-cyan-400 text-xl">✕</button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="gamingSessionForm" (ngSubmit)="startSession()" class="p-4 space-y-4">
              <!-- Session Type Badge -->
              @if (gamingSessionForm.get('sessionType')?.value !== 'gaming') {
                <div [ngClass]="{
                  'from-purple-600/30 to-purple-700/30 border-purple-400/50': gamingSessionForm.get('sessionType')?.value === 'league',
                  'from-orange-600/30 to-orange-700/30 border-orange-400/50': gamingSessionForm.get('sessionType')?.value === 'promotion'
                }" class="p-3 bg-gradient-to-r rounded-lg border">
                  <p [ngClass]="{
                    'text-purple-300': gamingSessionForm.get('sessionType')?.value === 'league',
                    'text-orange-300': gamingSessionForm.get('sessionType')?.value === 'promotion'
                  }" class="text-xs font-semibold uppercase">
                    @if (gamingSessionForm.get('sessionType')?.value === 'league') {
                      League/Competition: {{ gamingSessionForm.get('eventTitle')?.value }}
                    } @else if (gamingSessionForm.get('sessionType')?.value === 'promotion') {
                      Promotion: {{ gamingSessionForm.get('promoCode')?.value }}
                    }
                  </p>
                </div>
              }

              <!-- Player -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>👤</span>
                  <span>Player</span>
                </label>
                <div class="flex gap-2">
                  <select
                    formControlName="playerSearch"
                    class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">Select player...</option>
                    @for (player of players(); track player.id) {
                      <option [value]="player.id" class="bg-slate-800 text-white">
                        {{ player.email || player.cellphone }}
                      </option>
                    }
                    <option value="__add_player__" class="bg-slate-800 text-white">+ Add New Player</option>
                  </select>
                  <button
                    type="button"
                    (click)="showAddPlayerModal.set(true)"
                    class="px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 rounded-lg text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
                    title="Search players from other stores"
                  >
                    🔍
                  </button>
                </div>
              </div>

              <!-- Station -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>🖥️</span>
                  <span>Station</span>
                </label>
                <select
                  formControlName="station"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">Select station...</option>
                  @for (station of gamingStations(); track station.id) {
                    @if (station.isActive) {
                      <option [value]="station.id" class="bg-slate-800 text-white">{{ station.name }}</option>
                    }
                  }
                </select>
              </div>

              <!-- Duration -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>⏱️</span>
                  <span>Duration</span>
                </label>
                <select
                  formControlName="duration"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">Select duration...</option>
                  @for (duration of durationOptions(); track duration.id) {
                    @if (duration.isActive) {
                      <option [value]="duration.minutes" class="bg-slate-800 text-white">{{ duration.minutes }} min</option>
                    }
                  }
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>📝</span>
                  <span>Notes (optional)</span>
                </label>
                <textarea
                  formControlName="notes"
                  placeholder="Any notes..."
                  rows="2"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 resize-none"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <button
                type="submit"
                class="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span class="text-lg">▶</span>
                <span>Start Session</span>
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Add Player Modal -->
      @if (showAddPlayerModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-xl text-cyan-400">👤</span>
                <h2 class="text-xl font-bold text-white">Add Player</h2>
              </div>
              <button (click)="showAddPlayerModal.set(false)" class="text-white hover:text-cyan-400 text-xl">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 space-y-4">
              <!-- Tabs -->
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="addPlayerMode.set('new')"
                  [class.bg-cyan-600]="addPlayerMode() === 'new'"
                  [class.bg-white/10]="addPlayerMode() !== 'new'"
                  class="flex-1 py-2 px-3 rounded-lg font-medium text-white transition-colors"
                >
                  New Player
                </button>
                <button
                  type="button"
                  (click)="addPlayerMode.set('search')"
                  [class.bg-cyan-600]="addPlayerMode() === 'search'"
                  [class.bg-white/10]="addPlayerMode() !== 'search'"
                  class="flex-1 py-2 px-3 rounded-lg font-medium text-white transition-colors"
                >
                  Search
                </button>
              </div>

              <!-- New Player Form -->
              @if (addPlayerMode() === 'new') {
                <form [formGroup]="addPlayerForm" class="space-y-3">
                  <div>
                    <label class="block text-sm text-slate-300 font-semibold mb-1">Email (or Phone)</label>
                    <input
                      type="email"
                      formControlName="email"
                      placeholder="player@example.com"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-slate-300 font-semibold mb-1">Phone (or Email)</label>
                    <input
                      type="tel"
                      formControlName="cellphone"
                      placeholder="+1 (555) 000-0000"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-slate-300 font-semibold mb-1">Password</label>
                    <input
                      type="password"
                      formControlName="password"
                      placeholder="Minimum 8 characters"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    />
                    <p class="text-xs text-slate-400 mt-1">At least 8 characters required</p>
                  </div>
                  <button
                    type="button"
                    (click)="addNewPlayer()"
                    class="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm rounded-lg transition-all"
                  >
                    Add Player
                  </button>
                </form>
              }

              <!-- Search Player Form -->
              @if (addPlayerMode() === 'search') {
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-slate-300 font-semibold mb-1">Search by Email or Phone</label>
                    <input
                      type="text"
                      (keyup)="searchPlayers($event)"
                      placeholder="Search players..."
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    />
                  </div>
                  @if (searchResults().length > 0) {
                    <div class="max-h-64 overflow-y-auto space-y-2">
                      @for (result of searchResults(); track result.id) {
                        <button
                          type="button"
                          (click)="linkPlayerToStore(result.id)"
                          class="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-left text-sm text-slate-300 hover:text-white transition-colors"
                        >
                          {{ result.email || result.cellphone }}
                        </button>
                      }
                    </div>
                  } @else {
                    <p class="text-slate-400 text-sm text-center py-4">No players found</p>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- League & Competition Modal -->
      @if (showLeagueModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-xl text-purple-400">🏆</span>
                <h2 class="text-xl font-bold text-white">League / Competition</h2>
              </div>
              <button (click)="showLeagueModal.set(false)" class="text-white hover:text-purple-400 text-xl">✕</button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="leagueForm" (ngSubmit)="optInGamer()" class="p-4 space-y-4">
              <!-- Event -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>🎮</span>
                  <span>Event</span>
                </label>
                <select
                  formControlName="event"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
                >
                  <option value="">Select event...</option>
                  @for (event of events(); track event.id) {
                    <option [value]="event.id" class="bg-slate-800 text-white">{{ event.title }}</option>
                  }
                </select>
              </div>

              <!-- Player -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>👤</span>
                  <span>Player</span>
                </label>
                <select
                  formControlName="player"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
                >
                  <option value="">Select player...</option>
                  @for (player of players(); track player.id) {
                    <option [value]="player.id" class="bg-slate-800 text-white">
                      {{ player.email || player.cellphone }}
                    </option>
                  }
                </select>
              </div>

              <!-- Session Duration -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>⏱️</span>
                  <span>Session Duration</span>
                </label>
                <select
                  formControlName="sessionDuration"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
                >
                  <option value="30" class="bg-slate-800 text-white">30 min</option>
                  <option value="60" class="bg-slate-800 text-white">60 min (1h)</option>
                  <option value="120" class="bg-slate-800 text-white">120 min (2h)</option>
                  <option value="180" class="bg-slate-800 text-white">180 min (3h)</option>
                </select>
              </div>

              <!-- Action Button -->
              <button
                type="submit"
                class="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span class="text-lg">▶</span>
                <span>Opt-in Gamer</span>
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Apply Promotion Modal -->
      @if (showPromotionModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-xl text-orange-400">🎁</span>
                <h2 class="text-xl font-bold text-white">Apply Promotion</h2>
              </div>
              <button (click)="showPromotionModal.set(false)" class="text-white hover:text-orange-400 text-xl">✕</button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="promotionForm" class="p-4 space-y-4">
              <!-- Link to Player Session -->
              <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                <p class="text-slate-300 text-xs font-semibold uppercase mb-3">Link to Player Session</p>
                <div>
                  <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                    <span>👤</span>
                    <span>Player</span>
                  </label>
                  <select
                    formControlName="player"
                    class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50"
                  >
                    <option value="">Select player...</option>
                    @for (player of players(); track player.id) {
                      <option [value]="player.id" class="bg-slate-800 text-white">
                        {{ player.email || player.cellphone }}
                      </option>
                    }
                  </select>
                </div>
              </div>

              <!-- Promo Code -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>💳</span>
                  <span>Promo Code</span>
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    formControlName="promoCode"
                    placeholder="Enter code..."
                    class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50 uppercase"
                  />
                  <button
                    type="button"
                    (click)="lookupPromoCode()"
                    class="px-4 py-2 bg-orange-600/30 hover:bg-orange-600/50 border border-orange-400/50 rounded-lg text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors"
                  >
                    Look up
                  </button>
                </div>
              </div>

              <!-- Active Promotions -->
              <div>
                <p class="text-slate-300 text-xs font-semibold uppercase mb-3">Active Promotions</p>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  @if (promotions().length > 0) {
                    @for (promo of promotions(); track promo.id) {
                      <div (click)="selectPromotion(promo)" class="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-orange-400/50 transition-colors cursor-pointer">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h4 class="text-white font-semibold text-sm">{{ promo.title }}</h4>
                            <p class="text-slate-400 text-xs">{{ promo.type }} - {{ promo.discountValue }}% off</p>
                          </div>
                          <span class="text-orange-400 text-xs font-bold px-2 py-1 bg-orange-600/20 rounded">
                            {{ promo.promoCode }}
                          </span>
                        </div>
                      </div>
                    }
                  } @else {
                    <p class="text-slate-400 text-sm text-center py-4">No active promotions available</p>
                  }
                </div>
              </div>

              <!-- Action Button -->
              <button
                type="button"
                (click)="startPromotionSession()"
                class="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span class="text-lg">▶</span>
                <span>Start Gaming Session</span>
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
  public http = inject(HttpClient);
  public router = inject(Router);
  private fb = inject(FormBuilder);
  private apiUrl = environment.apiUrl;

  storeName = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  sidebarOpen = signal(true);
  showGamingSessionModal = signal(false);
  showAddPlayerModal = signal(false);
  showLeagueModal = signal(false);
  showPromotionModal = signal(false);
  gamingStations = signal<GamingStation[]>([]);
  durationOptions = signal<DurationOption[]>([]);
  rateOptions = signal<RateOption[]>([]);
  players = signal<Player[]>([]);
  searchResults = signal<Player[]>([]);
  events = signal<Event[]>([]);
  promotions = signal<Promotion[]>([]);
  addPlayerMode = signal<'new' | 'search'>('new');
  gamingSessionForm: FormGroup;
  addPlayerForm: FormGroup;
  leagueForm: FormGroup;
  promotionForm: FormGroup;
  selectedLeagueData: { eventId?: string; eventTitle?: string; duration?: number } = {};
  selectedPromotionData: { playerId?: string; promoCode?: string; promotionId?: string } = {};

  constructor() {
    this.gamingSessionForm = this.fb.group({
      playerSearch: ['', Validators.required],
      station: ['', Validators.required],
      duration: ['', Validators.required],
      rate: ['0'],
      notes: [''],
      sessionType: ['gaming'],
      eventId: [''],
      eventTitle: [''],
      promoCode: [''],
      promotionId: [''],
    });

    this.addPlayerForm = this.fb.group({
      email: ['', Validators.email],
      cellphone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.leagueForm = this.fb.group({
      event: ['', Validators.required],
      player: ['', Validators.required],
      sessionDuration: ['60', Validators.required],
      score: [''],
      result: [''],
    });

    this.promotionForm = this.fb.group({
      promoCode: ['', Validators.required],
      player: [''],
    });
  }

  ngOnInit(): void {
    this.loadStoreName();
    this.userEmail.set(this.authService.user().email || this.authService.user().cellphone || 'User');
    this.loadStoreData();
    this.loadEvents();
    this.loadPromotions();
  }

  private loadStoreName(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      this.storeName.set('Unknown Store');
      return;
    }

    this.http.get<{ data: Store }>(`${this.apiUrl}/api/stores/${storeId}`).subscribe({
      next: (response) => {
        this.storeName.set(response.data.name);
      },
      error: () => {
        this.storeName.set('Unknown Store');
      },
    });
  }

  private loadStoreData(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    // Load gaming stations
    this.http.get<{ data: GamingStation[] }>(`${this.apiUrl}/api/gaming-sessions/stations/${storeId}`).subscribe({
      next: (response) => {
        this.gamingStations.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load gaming stations:', err);
      },
    });

    // Load duration options from the correct endpoint
    this.http.get<{ data: DurationOption[] }>(`${this.apiUrl}/api/gaming-sessions/durations/${storeId}`).subscribe({
      next: (response) => {
        this.durationOptions.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load duration options:', err);
      },
    });

    // Load rate options from the correct endpoint
    this.http.get<{ data: RateOption[] }>(`${this.apiUrl}/api/gaming-sessions/rates/${storeId}`).subscribe({
      next: (response) => {
        this.rateOptions.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load rate options:', err);
      },
    });

    // Load players for this store
    this.loadPlayers();
  }

  private loadPlayers(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http.get<{ data: Player[] }>(`${this.apiUrl}/api/players/store/${storeId}`).subscribe({
      next: (response) => {
        this.players.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load players:', err);
      },
    });
  }

  addNewPlayer(): void {
    if (!this.addPlayerForm.valid) {
      return;
    }

    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    const formData = this.addPlayerForm.value;

    // Validate that at least email or cellphone is provided
    if (!formData.email && !formData.cellphone) {
      console.error('At least email or cellphone is required');
      return;
    }

    this.http.post<{ data: Player }>(`${this.apiUrl}/api/players`, {
      email: formData.email || undefined,
      cellphone: formData.cellphone || undefined,
      password: formData.password,
      storeIds: [storeId],
    }).subscribe({
      next: (response) => {
        this.players.set([...this.players(), response.data]);
        this.gamingSessionForm.patchValue({ playerSearch: response.data.id });
        this.showAddPlayerModal.set(false);
        this.addPlayerForm.reset();
      },
      error: (err) => {
        console.error('Failed to add player:', err);
      },
    });
  }

  searchPlayers(event: KeyboardEvent): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.http.get<{ data: Player[] }>(`${this.apiUrl}/api/players`).subscribe({
      next: (response) => {
        // Filter players based on search query and exclude those already in this store
        const currentPlayers = this.players();
        const filtered = (response.data || []).filter(p => {
          const matchesQuery = (p.email?.toLowerCase().includes(query) || p.cellphone?.includes(query));
          const notInStore = !currentPlayers.find(cp => cp.id === p.id);
          return matchesQuery && notInStore;
        });
        this.searchResults.set(filtered);
      },
      error: (err) => {
        console.error('Failed to search players:', err);
      },
    });
  }

  linkPlayerToStore(playerId: string): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http.post(`${this.apiUrl}/api/players/${playerId}/stores`, {
      storeIds: [storeId],
    }).subscribe({
      next: () => {
        this.loadPlayers();
        this.gamingSessionForm.patchValue({ playerSearch: playerId });
        this.showAddPlayerModal.set(false);
        this.searchResults.set([]);
      },
      error: (err) => {
        console.error('Failed to link player:', err);
      },
    });
  }

  startSession(): void {
    if (!this.gamingSessionForm.valid) {
      console.error('Form is invalid');
      return;
    }

    const formData = this.gamingSessionForm.value;
    const storeId = this.authService.storeId();

    // Get rate from the first available rate option, or use the form value
    let rate = formData.rate || '0';
    const firstRate = this.rateOptions()[0];
    if (firstRate && !formData.rate) {
      rate = firstRate.ratePerHour;
    }

    // Build session request with type-specific metadata
    const sessionRequest: any = {
      stationId: formData.station,
      durationMins: parseInt(formData.duration, 10),
      ratePerHour: rate,
      opponentType: undefined,
      notes: formData.notes,
    };

    // Add session type metadata
    if (formData.sessionType === 'league') {
      sessionRequest.opponentType = 'league';
      sessionRequest.notes = `${sessionRequest.notes || ''} League/Competition: ${formData.eventTitle}`.trim();
      sessionRequest.eventId = formData.eventId;
      sessionRequest.eventTitle = formData.eventTitle;
    } else if (formData.sessionType === 'promotion') {
      sessionRequest.opponentType = 'promotion';
      sessionRequest.notes = `${sessionRequest.notes || ''} Promo: ${formData.promoCode}`.trim();
      sessionRequest.promoCode = formData.promoCode;
      sessionRequest.promotionId = formData.promotionId;
      sessionRequest.ratePerHour = '0';
    }

    console.log('Starting session:', sessionRequest);

    // Create session via API
    this.http.post(`${this.apiUrl}/api/gaming-sessions`, sessionRequest).subscribe({
      next: (response: any) => {
        console.log('Session created:', response.data);
        // Reset form and close modal
        this.gamingSessionForm.reset({ duration: '60', rate: '10.00', sessionType: 'gaming' });
        this.showGamingSessionModal.set(false);
        this.selectedLeagueData = {};
        this.selectedPromotionData = {};
      },
      error: (err) => {
        console.error('Failed to create session:', err);
      },
    });
  }

  loadEvents(): void {
    this.http.get<{ data: Event[] }>(`${this.apiUrl}/api/events?status=upcoming`).subscribe({
      next: (response) => {
        this.events.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load events:', err);
      },
    });
  }

  loadPromotions(): void {
    const storeId = this.authService.storeId();
    if (!storeId) {
      return;
    }

    this.http.get<{ data: Promotion[] }>(`${this.apiUrl}/api/promotions?storeId=${storeId}`).subscribe({
      next: (response) => {
        this.promotions.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load promotions:', err);
      },
    });
  }

  optInGamer(): void {
    if (!this.leagueForm.valid) {
      console.error('Form is invalid');
      return;
    }

    const formData = this.leagueForm.value;
    const event = this.events().find(e => e.id === formData.event);

    // Store league/competition data
    this.selectedLeagueData = {
      eventId: formData.event,
      eventTitle: event?.title,
      duration: parseInt(formData.sessionDuration, 10),
    };

    // Pre-fill gaming session form
    this.gamingSessionForm.patchValue({
      playerSearch: formData.player,
      duration: formData.sessionDuration,
      sessionType: 'league',
      eventId: formData.event,
      eventTitle: event?.title,
    });

    // Close league modal and open gaming session modal
    this.showLeagueModal.set(false);
    this.showGamingSessionModal.set(true);
  }

  startPromotionSession(): void {
    const formData = this.promotionForm.value;

    if (!formData.promoCode && !this.selectedPromotionData.promoCode) {
      console.error('Please select a promotion');
      return;
    }

    // Pre-fill gaming session form
    this.gamingSessionForm.patchValue({
      playerSearch: formData.player,
      rate: '0',
      sessionType: 'promotion',
      promoCode: formData.promoCode || this.selectedPromotionData.promoCode,
      promotionId: this.selectedPromotionData.promotionId,
    });

    // Close promotion modal and open gaming session modal
    this.showPromotionModal.set(false);
    this.showGamingSessionModal.set(true);
  }

  selectPromotion(promo: Promotion): void {
    this.selectedPromotionData = {
      playerId: this.promotionForm.get('player')?.value,
      promoCode: promo.promoCode,
      promotionId: promo.id,
    };

    this.promotionForm.patchValue({
      promoCode: promo.promoCode,
    });
  }

  lookupPromoCode(): void {
    const promoCode = this.promotionForm.get('promoCode')?.value;
    if (!promoCode) {
      console.error('Promo code is required');
      return;
    }

    const storeId = this.authService.storeId();
    this.http.post<{ data: Promotion }>(`${this.apiUrl}/api/promotions/lookup`, {
      promoCode,
      storeId,
    }).subscribe({
      next: (response) => {
        console.log('Promotion found:', response.data);
        this.selectPromotion(response.data);
      },
      error: (err) => {
        console.error('Promo code not found:', err);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
