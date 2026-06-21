import { Component, inject, OnInit, computed } from '@angular/core';
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

interface PricingOption {
  id: string;
  durationMins: number;
  ratePerHour: string;
  label?: string;
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
  entryFeeType: string;
  eligibleSessions?: number;
  prizePool?: string;
  startDate: string;
  status: string;
}

interface EventRegistration {
  id: string;
  eventId: string;
  gamerId: string;
  totalEligibleSessions: number;
  usedSessions: number;
  status: string;
  currentRound?: string;
  isEliminated?: boolean;
  updatedAt?: string;
}

interface TournamentBracket {
  id: string;
  eventId: string;
  roundName: string;
  roundNumber: number;
  sessionRequirement: number;
  createdAt: string;
}

interface PlayerEventRegistration extends EventRegistration {
  eventTitle?: string;
  entryFeeType?: string;
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
          <div (click)="router.navigate(['/results-history'])" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">📜</span>
            @if (sidebarOpen()) {
              <span>Results History</span>
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
                }" class="p-3 bg-gradient-to-r rounded-lg border flex items-center justify-between">
                  <div>
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
                    <!-- Entry Fee Type for League Events -->
                    @if (gamingSessionForm.get('sessionType')?.value === 'league' && selectedLeagueData.entryFeeType) {
                      <p class="text-xs mt-2 text-slate-300">
                        {{ formatEntryFeeType(selectedLeagueData.entryFeeType) }}
                      </p>
                    }
                  </div>
                  <button
                    type="button"
                    (click)="clearSessionType()"
                    class="ml-4 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              }

              <!-- Player -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>👤</span>
                  <span>Player</span>
                  @if (playersLoading()) {
                    <span class="text-yellow-400 text-xs">(Loading...)</span>
                  }
                </label>
                @if (playersError()) {
                  <div class="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 mb-2">
                    <p class="text-red-200 text-xs">{{ playersError() }}</p>
                  </div>
                }
                <div class="flex gap-2">
                  <select
                    formControlName="playerSearch"
                    (change)="onGamingSessionPlayerSelected($event)"
                    class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50"
                    [disabled]="playersLoading() || players().length === 0"
                  >
                    @if (playersLoading()) {
                      <option value="">Loading players...</option>
                    } @else if (players().length === 0) {
                      <option value="">No players available</option>
                    } @else {
                      <option value="">Select a player...</option>
                      @for (player of players(); track player.id) {
                        <option [value]="player.id" class="bg-slate-800 text-white">
                          {{ player.email || player.cellphone }}
                        </option>
                      }
                    }
                  </select>
                  <button
                    type="button"
                    (click)="showAddPlayerModal.set(true)"
                    class="px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 rounded-lg text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
                    title="Add or search for players"
                  >
                    ➕
                  </button>
                </div>
                @if (players().length > 0) {
                  <p class="text-xs text-slate-400 mt-1">{{ players().length }} player(s) available</p>
                }
              </div>

              <!-- Reserved Sessions Card -->
              @if (playerReservedSessions().length > 0) {
                <div class="p-4 bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-400/50 rounded-lg space-y-3">
                  <div>
                    <p class="text-green-300 text-xs font-semibold">🎮 Player Has Reserved Sessions</p>
                    <p class="text-slate-300 text-sm mt-1">Select an event to play or start a regular gaming session</p>
                  </div>

                  <div class="space-y-2">
                    @for (reg of playerReservedSessions(); track reg.id) {
                      <label class="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          [checked]="selectedReservedSession()?.id === reg.id"
                          (change)="toggleReservedSession(reg)"
                          class="w-4 h-4 rounded accent-green-500 cursor-pointer"
                        />
                        <div class="flex-1">
                          <p class="text-white font-semibold text-sm">{{ reg.eventTitle }}</p>
                          <p class="text-slate-400 text-xs">Sessions: <span class="text-green-400 font-bold">{{ (reg.totalEligibleSessions - reg.usedSessions) }}</span> / {{ reg.totalEligibleSessions }}</p>
                        </div>
                      </label>
                    }
                  </div>
                </div>
              }

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
                  (change)="onDurationSelected($event)"
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

              <!-- Rate (Auto-calculated from Duration) -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>💰</span>
                  <span>Rate (Auto)</span>
                </label>
                <div class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-400">
                  @if (selectedDurationRate()) {
                    <span class="text-cyan-300 font-semibold">{{ selectedDurationRate() }}</span>
                  } @else {
                    <span class="text-slate-500">Select duration to see rate</span>
                  }
                </div>
              </div>

              <!-- Payment Model Info for League Events -->
              @if (gamingSessionForm.get('sessionType')?.value === 'league' && selectedLeagueData.entryFeeType) {
                <div [ngClass]="{
                  'from-cyan-600/20 to-cyan-700/20 border-cyan-400/50': selectedLeagueData.entryFeeType === 'entry_fee',
                  'from-blue-600/20 to-blue-700/20 border-blue-400/50': selectedLeagueData.entryFeeType === 'pay_per_session'
                }" class="p-3 bg-gradient-to-r rounded-lg border text-xs">
                  @if (selectedLeagueData.entryFeeType === 'entry_fee') {
                    <p class="text-cyan-300 font-semibold">💳 Entry Fee Model</p>
                    <p class="text-slate-300 mt-1">Player will be charged a one-time entry fee to participate in this event.</p>
                  } @else if (selectedLeagueData.entryFeeType === 'pay_per_session') {
                    <p class="text-blue-300 font-semibold">⏱️ Pay Per Session Model</p>
                    <p class="text-slate-300 mt-1">Player will be charged per session at the configured rate ({{ selectedDurationRate() || '0' }} for {{ gamingSessionForm.get('duration')?.value }} mins).</p>
                  }
                </div>
              }

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
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-2">
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
              <!-- Error Message -->
              @if (eventsError()) {
                <div class="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 mb-3">
                  <p class="text-red-200 text-xs">{{ eventsError() }}</p>
                </div>
              }

              <!-- Event -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>🎮</span>
                  <span>Event</span>
                  @if (eventsLoading()) {
                    <span class="text-yellow-400 text-xs">(Loading...)</span>
                  }
                </label>
                <select
                  formControlName="event"
                  (change)="onEventSelected($event)"
                  [disabled]="eventsLoading()"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                >
                  <option value="">{{ eventsLoading() ? 'Loading events...' : 'Select event...' }}</option>
                  @for (event of events(); track event.id) {
                    <option [value]="event.id" class="bg-slate-800 text-white">{{ event.title }}</option>
                  }
                </select>
              </div>

              <!-- Event Details Card -->
              @if (selectedEventDetailsCard()) {
                <div class="p-3 bg-purple-600/20 border border-purple-400/50 rounded-lg">
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-slate-400 text-xs font-semibold">Game</p>
                      <p class="text-white font-semibold">{{ selectedEventDetailsCard()!.game }}</p>
                    </div>
                    <div>
                      <p class="text-slate-400 text-xs font-semibold">Type</p>
                      <p class="text-white font-semibold">{{ selectedEventDetailsCard()!.eventType }}</p>
                    </div>
                    <div>
                      <p class="text-slate-400 text-xs font-semibold">Fee Model</p>
                      <p class="text-purple-300 font-semibold">{{ formatEntryFeeType(selectedEventDetailsCard()!.entryFeeType) }}</p>
                    </div>
                    @if (selectedEventDetailsCard()?.prizePool) {
                      <div>
                        <p class="text-slate-400 text-xs font-semibold">Prize Pool</p>
                        <p class="text-green-400 font-semibold">{{ selectedEventDetailsCard()?.prizePool }}</p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Registration Status Card -->
              @if (gamerRegistration()) {
                <div class="p-4 bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-400/50 rounded-lg space-y-3">
                  <div>
                    <p class="text-green-300 text-xs font-semibold">✅ Already Registered</p>
                    <p class="text-slate-300 text-sm mt-1">
                      Sessions remaining: <span class="font-bold text-green-400">{{ (gamerRegistration()!.totalEligibleSessions - gamerRegistration()!.usedSessions) }}</span> / {{ gamerRegistration()!.totalEligibleSessions }}
                    </p>
                  </div>

                  <!-- Tournament Status (if applicable) -->
                  @if (tournamentBrackets().length > 0) {
                    <div class="pt-3 border-t border-green-400/30">
                      <p class="text-slate-400 text-xs font-semibold mb-2">🏆 Tournament Status</p>
                      <div class="space-y-2">
                        @if (gamerRegistration()!.currentRound) {
                          <div class="flex items-center justify-between">
                            <span class="text-slate-300 text-sm">Current Round:</span>
                            <span class="text-green-300 font-semibold text-sm">{{ gamerRegistration()!.currentRound }}</span>
                          </div>
                        }
                        @if (gamerRegistration()!.isEliminated) {
                          <div class="flex items-center gap-2 bg-red-600/20 px-2 py-1 rounded border border-red-400/50">
                            <span class="text-red-400 text-sm font-semibold">🚫 Eliminated</span>
                          </div>
                        } @else if (nextRound() && (gamerRegistration()!.totalEligibleSessions - gamerRegistration()!.usedSessions) > 0) {
                          <div class="space-y-2">
                            <p class="text-slate-300 text-xs">Next Round: <span class="text-cyan-300 font-semibold">{{ nextRound()!.roundName }}</span> (requires {{ nextRound()!.sessionRequirement }} session)</p>
                            <div class="flex gap-2">
                              <button
                                type="button"
                                (click)="advanceToNextRound()"
                                class="flex-1 px-2 py-1 bg-green-600/50 hover:bg-green-600/70 text-green-300 text-xs font-semibold rounded transition-colors border border-green-400/50"
                              >
                                ✅ Advance
                              </button>
                              <button
                                type="button"
                                (click)="eliminateFromTournament()"
                                class="flex-1 px-2 py-1 bg-red-600/50 hover:bg-red-600/70 text-red-300 text-xs font-semibold rounded transition-colors border border-red-400/50"
                              >
                                ❌ Eliminate
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  @if ((gamerRegistration()!.totalEligibleSessions - gamerRegistration()!.usedSessions) <= 0) {
                    <p class="text-red-400 text-xs mt-2">⚠️ No sessions remaining for this event</p>
                  }
                </div>
              }

              <!-- Player -->
              <div>
                <label class="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-2">
                  <span>👤</span>
                  <span>Player</span>
                  @if (playersLoading()) {
                    <span class="text-yellow-400 text-xs">(Loading...)</span>
                  }
                </label>
                @if (playersError()) {
                  <div class="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 mb-2">
                    <p class="text-red-200 text-xs">{{ playersError() }}</p>
                  </div>
                }
                <div class="flex gap-2">
                  <select
                    formControlName="player"
                    (change)="onPlayerSelected($event)"
                    [disabled]="playersLoading()"
                    class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                  >
                    <option value="">{{ playersLoading() ? 'Loading players...' : 'Select player...' }}</option>
                    @for (player of players(); track player.id) {
                      <option [value]="player.id" class="bg-slate-800 text-white">
                        {{ player.email || player.cellphone }}
                      </option>
                    }
                  </select>
                  <button
                    type="button"
                    (click)="showAddPlayerModal.set(true)"
                    class="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 rounded-lg text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                    title="Add or search for players"
                  >
                    ➕
                  </button>
                </div>
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

      <!-- Session Start Dialog (Entry Fee) -->
      @if (showSessionStartDialog()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-2">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/80 backdrop-blur sticky top-0">
              <div class="flex items-center gap-3">
                <span class="text-xl text-cyan-400">⚡</span>
                <h2 class="text-xl font-bold text-white">Start Session?</h2>
              </div>
              <button (click)="showSessionStartDialog.set(false)" class="text-white hover:text-cyan-400 text-xl">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <div class="bg-cyan-600/20 border border-cyan-400/50 rounded-lg p-4">
                <p class="text-white font-semibold mb-2">💳 Entry Fee Event</p>
                <p class="text-slate-300 text-sm">
                  This event requires an entry fee. Would you like to start a session now, or reserve it for later?
                </p>
              </div>

              <div class="space-y-3">
                <button
                  (click)="startSessionImmediately()"
                  class="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span class="text-lg">▶️</span>
                  <span>Start Now</span>
                </button>

                <button
                  (click)="reserveSessionForLater()"
                  class="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-slate-600"
                >
                  <span class="text-lg">📅</span>
                  <span>Reserve for Later</span>
                </button>
              </div>

              <p class="text-xs text-slate-400 text-center">
                Entry fee will be charged when you reserve
              </p>
            </div>
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
  pricingOptions = signal<PricingOption[]>([]);
  formDurationValue = signal<string>('60');
  selectedDurationRate = computed(() => {
    const duration = this.formDurationValue();
    const pricing = this.pricingOptions();

    if (!duration || !pricing.length) {
      return null;
    }

    const durationMins = parseInt(duration, 10);
    const option = pricing.find(p => p.isActive && p.durationMins === durationMins);
    return option ? option.ratePerHour.toString() : null;
  });
  players = signal<Player[]>([]);
  searchResults = signal<Player[]>([]);
  events = signal<Event[]>([]);
  promotions = signal<Promotion[]>([]);
  selectedEventDetails = signal<Event | null>(null);
  selectedEventDetailsCard = computed(() => {
    const event = this.selectedEventDetails();
    if (!event) return null;
    return {
      game: event.game || 'N/A',
      eventType: event.eventType || 'N/A',
      entryFeeType: event.entryFeeType,
      prizePool: event.prizePool,
    };
  });
  addPlayerMode = signal<'new' | 'search'>('new');
  eventsLoading = signal(false);
  eventsError = signal<string | null>(null);
  playersLoading = signal(false);
  playersError = signal<string | null>(null);
  showSessionStartDialog = signal(false);
  pendingSessionData = signal<{ eventId: string; playerId: string; entryFeeType?: string } | null>(null);
  gamerRegistration = signal<EventRegistration | null>(null);
  registrationLoading = signal(false);
  tournamentBrackets = signal<TournamentBracket[]>([]);
  bracketsLoading = signal(false);
  nextRound = computed(() => {
    const brackets = this.tournamentBrackets();
    const registration = this.gamerRegistration();
    if (!brackets || !registration || !registration.currentRound) return null;
    const currentRoundNum = brackets.find(b => b.roundName === registration.currentRound)?.roundNumber;
    if (currentRoundNum === undefined) return null;
    return brackets.find(b => b.roundNumber === currentRoundNum + 1) || null;
  });
  playerReservedSessions = signal<PlayerEventRegistration[]>([]);
  reservedSessionsLoading = signal(false);
  selectedReservedSession = signal<PlayerEventRegistration | null>(null);
  gamingSessionForm: FormGroup;
  addPlayerForm: FormGroup;
  leagueForm: FormGroup;
  promotionForm: FormGroup;
  selectedLeagueData: { eventId?: string; eventTitle?: string; duration?: number; entryFeeType?: string } = {};
  selectedPromotionData: { playerId?: string; promoCode?: string; promotionId?: string } = {};

  constructor() {
    this.gamingSessionForm = this.fb.group({
      playerSearch: ['', Validators.required],
      station: ['', Validators.required],
      duration: ['60', Validators.required],
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

    // Subscribe to form duration changes and update signal
    // This makes the computed selectedDurationRate re-evaluate automatically
    this.gamingSessionForm.get('duration')?.valueChanges.subscribe((value) => {
      if (value) {
        this.formDurationValue.set(value);
      }
    });
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

    // Load pricing options (duration to rate mapping for this store)
    this.http.get<{ data: PricingOption[] }>(`${this.apiUrl}/api/stores/${storeId}/pricing-options`).subscribe({
      next: (response) => {
        console.log('Pricing options loaded:', response.data);
        this.pricingOptions.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load pricing options:', err);
      },
    });

    // Load players for this store
    this.loadPlayers();
  }

  private loadPlayers(): void {
    const storeId = this.authService.storeId();
    console.log('Current storeId:', storeId);

    if (!storeId) {
      this.playersError.set('Store ID not available');
      console.error('Store ID is missing');
      return;
    }

    this.playersLoading.set(true);
    this.playersError.set(null);
    const url = `${this.apiUrl}/api/players/store/${storeId}`;
    console.log('Loading players from:', url);

    this.http.get<{ data: Player[] }>(url).subscribe({
      next: (response) => {
        console.log('Players loaded successfully:', response.data);
        this.players.set(response.data || []);
        this.playersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load players:', err);
        const errorMsg = err.error?.error || err.message || 'Failed to load players';
        this.playersError.set(errorMsg);
        this.playersLoading.set(false);
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
        // Populate player in the appropriate form based on which modal is open
        if (this.showLeagueModal()) {
          this.leagueForm.patchValue({ player: response.data.id });
        } else {
          this.gamingSessionForm.patchValue({ playerSearch: response.data.id });
        }
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
        // Populate player in the appropriate form based on which modal is open
        if (this.showLeagueModal()) {
          this.leagueForm.patchValue({ player: playerId });
        } else {
          this.gamingSessionForm.patchValue({ playerSearch: playerId });
        }
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

    // Validate player is selected
    if (!formData.playerSearch) {
      console.error('No player selected');
      return;
    }

    // Validate rate is available
    const rate = this.selectedDurationRate();
    if (!rate) {
      console.error('No rate configured for selected duration');
      return;
    }

    // Build session request with type-specific metadata
    const sessionRequest: any = {
      userId: formData.playerSearch,
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
    } else if (formData.sessionType === 'gaming' && this.selectedReservedSession()) {
      // If player has a reserved session selected
      const reserved = this.selectedReservedSession()!;
      sessionRequest.opponentType = 'reserved_event';
      sessionRequest.notes = `${sessionRequest.notes || ''} Reserved Event: ${reserved.eventTitle}`.trim();
      sessionRequest.eventId = reserved.eventId;
      sessionRequest.eventTitle = reserved.eventTitle;
    }

    console.log('Starting session:', sessionRequest);

    // Create session via API
    this.http.post(`${this.apiUrl}/api/gaming-sessions`, sessionRequest).subscribe({
      next: (response: any) => {
        console.log('Session created:', response.data);

        // If this is a league event with registration, consume a session
        if (formData.sessionType === 'league' && this.gamerRegistration()) {
          this.consumeSession(this.gamerRegistration()!.id);
        } else if (this.selectedReservedSession()) {
          // Consume reserved session
          this.consumeSession(this.selectedReservedSession()!.id);
        }

        // Reset form and close modal (all fields reset except keep duration default)
        this.gamingSessionForm.reset({ duration: '60', sessionType: 'gaming' });
        this.showGamingSessionModal.set(false);
        this.selectedLeagueData = {};
        this.selectedPromotionData = {};
        this.playerReservedSessions.set([]);
        this.selectedReservedSession.set(null);
      },
      error: (err) => {
        console.error('Failed to create session:', err);
      },
    });
  }

  loadEvents(): void {
    this.eventsLoading.set(true);
    this.eventsError.set(null);
    const url = `${this.apiUrl}/api/events?status=upcoming`;
    console.log('Loading events from:', url);

    this.http.get<{ data: Event[] }>(url).subscribe({
      next: (response) => {
        console.log('Events loaded successfully:', response.data);
        this.events.set(response.data || []);
        this.eventsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        const errorMsg = err.error?.error || err.message || 'Failed to load events';
        this.eventsError.set(errorMsg);
        this.eventsLoading.set(false);
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
    const registration = this.gamerRegistration();

    // Check if already registered and has sessions remaining
    if (registration) {
      const remainingSessions = registration.totalEligibleSessions - registration.usedSessions;
      if (remainingSessions <= 0) {
        alert('❌ No remaining sessions for this event. Please register again to add more sessions.');
        return;
      }
      // Already registered, proceed directly to gaming session
      const currentDuration = this.gamingSessionForm.get('duration')?.value || '60';
      const currentStation = this.gamingSessionForm.get('station')?.value || '';
      const currentNotes = this.gamingSessionForm.get('notes')?.value || '';

      this.selectedLeagueData = {
        eventId: formData.event,
        eventTitle: event?.title,
        duration: parseInt(currentDuration, 10),
        entryFeeType: event?.entryFeeType,
      };

      this.gamingSessionForm.patchValue({
        playerSearch: formData.player, // Auto-populate with selected player
        station: currentStation,
        duration: currentDuration,
        notes: currentNotes,
        sessionType: 'league',
        eventId: formData.event,
        eventTitle: event?.title,
      });

      this.showLeagueModal.set(false);
      this.showGamingSessionModal.set(true);
      return;
    }

    // Not registered yet - if entry fee event, show dialog
    if (event?.entryFeeType === 'entry_fee') {
      this.pendingSessionData.set({
        eventId: formData.event,
        playerId: formData.player,
        entryFeeType: event.entryFeeType,
      });
      this.showSessionStartDialog.set(true);
      return;
    }

    // For pay-per-session events with no registration, proceed directly
    const currentDuration = this.gamingSessionForm.get('duration')?.value || '60';
    const currentStation = this.gamingSessionForm.get('station')?.value || '';
    const currentNotes = this.gamingSessionForm.get('notes')?.value || '';

    this.selectedLeagueData = {
      eventId: formData.event,
      eventTitle: event?.title,
      duration: parseInt(currentDuration, 10),
      entryFeeType: event?.entryFeeType,
    };

    this.gamingSessionForm.patchValue({
      playerSearch: formData.player, // Auto-populate with selected player
      station: currentStation,
      duration: currentDuration,
      notes: currentNotes,
      sessionType: 'league',
      eventId: formData.event,
      eventTitle: event?.title,
    });

    this.showLeagueModal.set(false);
    this.showGamingSessionModal.set(true);
  }

  startPromotionSession(): void {
    const formData = this.promotionForm.value;

    if (!formData.promoCode && !this.selectedPromotionData.promoCode) {
      console.error('Please select a promotion');
      return;
    }

    // Reset gaming form but preserve duration, station, notes - only set promotion details
    const currentDuration = this.gamingSessionForm.get('duration')?.value || '60';
    const currentStation = this.gamingSessionForm.get('station')?.value || '';
    const currentNotes = this.gamingSessionForm.get('notes')?.value || '';

    this.gamingSessionForm.patchValue({
      playerSearch: formData.player, // Auto-populate with selected player
      station: currentStation,
      duration: currentDuration,
      notes: currentNotes,
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

  onEventSelected(event: any): void {
    const eventId = event.target.value;
    const selectedEvent = this.events().find(e => e.id === eventId);
    this.selectedEventDetails.set(selectedEvent || null);

    // Check if current player is already registered
    const currentPlayerId = this.leagueForm.get('player')?.value;
    if (eventId && currentPlayerId) {
      this.checkRegistration(eventId, currentPlayerId);
    } else {
      this.gamerRegistration.set(null);
    }
  }

  onPlayerSelected(event: any): void {
    const playerId = event.target.value;
    const eventId = this.leagueForm.get('event')?.value;

    // Check if player is already registered for selected event
    if (eventId && playerId) {
      this.checkRegistration(eventId, playerId);
    } else {
      this.gamerRegistration.set(null);
    }
  }

  onGamingSessionPlayerSelected(event: any): void {
    const playerId = event.target.value;
    this.selectedReservedSession.set(null);

    if (playerId) {
      // Load player's reserved sessions
      this.loadPlayerReservedSessions(playerId);
    } else {
      this.playerReservedSessions.set([]);
    }
  }

  toggleReservedSession(registration: PlayerEventRegistration): void {
    const isCurrentlySelected = this.selectedReservedSession()?.id === registration.id;

    if (isCurrentlySelected) {
      // Uncheck - deselect the session
      this.selectedReservedSession.set(null);
    } else {
      // Check - select the session
      this.selectedReservedSession.set(registration);
    }
  }

  clearSessionType(): void {
    this.gamingSessionForm.patchValue({
      sessionType: 'gaming',
      eventId: '',
      eventTitle: '',
      promoCode: '',
      promotionId: '',
    });
    this.selectedLeagueData = {};
    this.selectedPromotionData = {};
    this.playerReservedSessions.set([]);
    this.selectedReservedSession.set(null);
  }

  onDurationSelected(event: any): void {
    const value = event.target.value;
    if (value) {
      this.formDurationValue.set(value);
    }

    // Log warnings if no pricing is found
    const durationMins = parseInt(value, 10);
    const pricingOption = this.pricingOptions().find(
      p => p.isActive && p.durationMins === durationMins
    );
    if (!pricingOption) {
      console.warn(`No pricing configured for ${durationMins} minutes in this store`);
    }
  }

  checkRegistration(eventId: string, gamerId: string): void {
    this.registrationLoading.set(true);
    const url = `${this.apiUrl}/api/events/${eventId}/registration/${gamerId}`;
    console.log('Checking registration:', url);

    this.http.get<{ data: EventRegistration }>(url).subscribe({
      next: (response) => {
        console.log('Registration found:', response.data);
        this.gamerRegistration.set(response.data);
        this.registrationLoading.set(false);
        // Load tournament brackets if event has them
        this.loadTournamentBrackets(eventId);
      },
      error: (err) => {
        console.log('No existing registration:', err.status);
        this.gamerRegistration.set(null);
        this.registrationLoading.set(false);
      },
    });
  }

  loadTournamentBrackets(eventId: string): void {
    this.bracketsLoading.set(true);
    const url = `${this.apiUrl}/api/events/${eventId}/tournament-brackets`;
    console.log('Loading tournament brackets:', url);

    this.http.get<{ data: TournamentBracket[] }>(url).subscribe({
      next: (response) => {
        console.log('Tournament brackets loaded:', response.data);
        this.tournamentBrackets.set(response.data || []);
        this.bracketsLoading.set(false);
      },
      error: (err) => {
        console.log('No tournament brackets found or error:', err.status);
        this.tournamentBrackets.set([]);
        this.bracketsLoading.set(false);
      },
    });
  }

  advanceToNextRound(): void {
    const registration = this.gamerRegistration();
    const brackets = this.tournamentBrackets();
    if (!registration || !brackets.length) return;

    const currentBracket = brackets.find(b => b.roundName === registration.currentRound);
    if (!currentBracket) return;

    const nextBracketNum = currentBracket.roundNumber + 1;
    const nextBracket = brackets.find(b => b.roundNumber === nextBracketNum);
    if (!nextBracket) return;

    // Call API to check if can advance
    const url = `${this.apiUrl}/api/events/${registration.eventId}/registrations/${registration.id}/can-advance`;
    this.http.post<{ data: any }>(url, { nextRoundNumber: nextBracketNum }).subscribe({
      next: (response) => {
        console.log('Can advance:', response.data);
        // Update gamer tournament status to next round (assuming win)
        this.updateTournamentStatus(registration.id, nextBracket.roundName, 'win');
      },
      error: (err) => {
        console.error('Cannot advance:', err);
        alert(`❌ Cannot advance: ${err.error?.error || 'Not enough sessions or already eliminated'}`);
      },
    });
  }

  eliminateFromTournament(): void {
    const registration = this.gamerRegistration();
    if (!registration) return;

    const brackets = this.tournamentBrackets();
    const currentBracket = brackets.find(b => b.roundName === registration.currentRound);
    if (!currentBracket) return;

    this.updateTournamentStatus(registration.id, registration.currentRound || '', 'loss');
  }

  private updateTournamentStatus(registrationId: string, roundName: string, matchResult: 'win' | 'loss'): void {
    const url = `${this.apiUrl}/api/registrations/${registrationId}/tournament-status`;
    this.http.post<{ data: EventRegistration }>(url, {
      currentRound: roundName,
      matchResult,
    }).subscribe({
      next: (response) => {
        console.log('Tournament status updated:', response.data);
        this.gamerRegistration.set(response.data);
        if (matchResult === 'win') {
          alert('✅ Gamer advanced to the next round!');
        } else {
          alert('❌ Gamer has been eliminated from the tournament.');
        }
      },
      error: (err) => {
        console.error('Failed to update tournament status:', err);
        alert(`❌ Error: ${err.error?.error || 'Failed to update status'}`);
      },
    });
  }

  formatEntryFeeType(type: string): string {
    switch (type) {
      case 'entry_fee':
        return '💳 Entry Fee (Pay Once)';
      case 'pay_per_session':
        return '⏱️ Pay Per Session';
      default:
        return 'Standard';
    }
  }

  startSessionImmediately(): void {
    const data = this.pendingSessionData();
    if (!data) return;

    const event = this.events().find(e => e.id === data.eventId);
    const currentDuration = this.gamingSessionForm.get('duration')?.value || '60';
    const currentStation = this.gamingSessionForm.get('station')?.value || '';
    const currentNotes = this.gamingSessionForm.get('notes')?.value || '';

    this.selectedLeagueData = {
      eventId: data.eventId,
      eventTitle: event?.title,
      duration: parseInt(currentDuration, 10),
      entryFeeType: event?.entryFeeType,
    };

    this.gamingSessionForm.patchValue({
      playerSearch: data.playerId, // Auto-populate with selected player
      station: currentStation,
      duration: currentDuration,
      notes: currentNotes,
      sessionType: 'league',
      eventId: data.eventId,
      eventTitle: event?.title,
    });

    this.showSessionStartDialog.set(false);
    this.showLeagueModal.set(false);
    this.showGamingSessionModal.set(true);
    this.pendingSessionData.set(null);
  }

  reserveSessionForLater(): void {
    const data = this.pendingSessionData();
    if (!data) return;

    const eventId = data.eventId;
    const gamerId = data.playerId;

    // Call API to register gamer for event
    this.http
      .post<{ data: any }>(`${this.apiUrl}/api/events/${eventId}/register`, {
        gamerId,
      })
      .subscribe({
        next: (response) => {
          console.log('Gamer registered successfully:', response.data);
          alert(`✅ Session reserved! Entry fee has been charged. You have ${response.data.totalEligibleSessions} session(s) available for this event.`);

          this.showSessionStartDialog.set(false);
          this.showLeagueModal.set(false);
          this.pendingSessionData.set(null);
        },
        error: (err) => {
          console.error('Failed to register gamer:', err);
          alert(`❌ Error: ${err.error?.error || 'Failed to reserve session'}`);
        },
      });
  }

  consumeSession(registrationId: string): void {
    if (!registrationId) {
      console.warn('No registration ID to consume session');
      return;
    }

    this.http
      .post<{ data: any }>(`${this.apiUrl}/api/registrations/${registrationId}/use-session`, {})
      .subscribe({
        next: (response) => {
          console.log('Session consumed:', response.data);
          const remaining = response.data.registration.totalEligibleSessions - response.data.registration.usedSessions;
          console.log(`Session ${response.data.sessionNumber} started. ${remaining} sessions remaining.`);
          // Refresh registration to show updated session count
          if (this.gamerRegistration()) {
            this.gamerRegistration.set(response.data.registration);
          }
        },
        error: (err) => {
          console.error('Failed to consume session:', err);
        },
      });
  }

  loadPlayerReservedSessions(playerId: string): void {
    this.reservedSessionsLoading.set(true);
    const url = `${this.apiUrl}/api/events/player/${playerId}/registrations`;
    console.log('Loading player reserved sessions:', url);

    this.http.get<{ data: PlayerEventRegistration[] }>(url).subscribe({
      next: (response) => {
        console.log('Player registrations loaded:', response.data);
        // Filter for active registrations with remaining sessions
        const active = (response.data || []).filter(
          reg => reg.status === 'active' && (reg.totalEligibleSessions - reg.usedSessions) > 0
        );
        this.playerReservedSessions.set(active);
        this.reservedSessionsLoading.set(false);
      },
      error: (err) => {
        console.log('No reserved sessions found:', err.status);
        this.playerReservedSessions.set([]);
        this.reservedSessionsLoading.set(false);
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
