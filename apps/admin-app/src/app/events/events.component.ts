import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface Store {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

interface Event {
  id: string;
  storeId?: string;
  title: string;
  game?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  prizePool?: string;
  maxPlayers?: number;
  currentPlayers: number;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EventResult {
  id: string;
  eventId: string;
  playerUsername: string;
  result: string;
  placement?: number;
  score?: string;
  pointsEarned?: number;
  kills: number;
  deaths: number;
  assists: number;
  createdAt?: string;
}

interface User {
  id: string;
  email?: string;
  cellphone?: string;
}

type StatusFilter = 'all' | 'upcoming' | 'live' | 'completed' | 'cancelled';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col flex-shrink-0 overflow-y-auto">
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2 cursor-pointer" (click)="goBack()">
            <span class="text-lg">←</span>
            <h2 class="text-white font-bold">Back to Dashboard</h2>
          </div>
        </div>
        <nav class="flex-1">
          <h3 class="text-white font-bold text-sm mb-4">Management</h3>
          <div class="space-y-2">
            <div class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3">
              <span class="text-lg">🎮</span>
              <span>Events</span>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header -->
        <header class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Events Management</h1>
            <p class="text-slate-400 text-sm">Create and manage gaming events across stores</p>
          </div>
          <button
            (click)="showCreateModal.set(true)"
            class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>Create Event</span>
          </button>
        </header>

        <!-- Status Filter Tabs -->
        <div class="bg-black/40 border-b border-white/10 px-8 flex gap-0">
          <button
            (click)="activeStatusFilter.set('all')"
            [class.border-b-2]="activeStatusFilter() === 'all'"
            [class.border-cyan-400]="activeStatusFilter() === 'all'"
            class="px-6 py-4 text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>📋</span>
            <span>All</span>
          </button>
          <button
            (click)="activeStatusFilter.set('upcoming')"
            [class.border-b-2]="activeStatusFilter() === 'upcoming'"
            [class.border-cyan-400]="activeStatusFilter() === 'upcoming'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>⏳</span>
            <span>Upcoming</span>
          </button>
          <button
            (click)="activeStatusFilter.set('live')"
            [class.border-b-2]="activeStatusFilter() === 'live'"
            [class.border-cyan-400]="activeStatusFilter() === 'live'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>🔴</span>
            <span>Live</span>
          </button>
          <button
            (click)="activeStatusFilter.set('completed')"
            [class.border-b-2]="activeStatusFilter() === 'completed'"
            [class.border-cyan-400]="activeStatusFilter() === 'completed'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>✅</span>
            <span>Completed</span>
          </button>
          <button
            (click)="activeStatusFilter.set('cancelled')"
            [class.border-b-2]="activeStatusFilter() === 'cancelled'"
            [class.border-cyan-400]="activeStatusFilter() === 'cancelled'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>❌</span>
            <span>Cancelled</span>
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-y-auto overflow-x-hidden w-full">
          <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white">Events List</h2>
            </div>

            @if (errorMessage()) {
              <div class="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-4">
                <p class="text-red-200 text-sm">{{ errorMessage() }}</p>
              </div>
            }
            @if (successMessage()) {
              <div class="bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-3 mb-4">
                <p class="text-green-200 text-sm">{{ successMessage() }}</p>
              </div>
            }

            <div class="text-slate-400 text-sm mb-4">
              Showing {{ filteredEvents().length }} events
            </div>

            <!-- Events Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              @if (filteredEvents().length === 0) {
                <div class="col-span-full text-center py-12">
                  <p class="text-slate-400 text-lg">No events found</p>
                </div>
              } @else {
                @for (event of filteredEvents(); track event.id) {
                  <div class="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-400/50 transition-all">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <h3 class="text-white font-bold text-lg">{{ event.title }}</h3>
                          <span
                            [class]="getStatusBadgeClass(event.status)"
                            class="px-2 py-1 rounded text-xs font-semibold"
                          >
                            {{ event.status }}
                          </span>
                        </div>
                        <p class="text-slate-400 text-sm">
                          {{ event.game }} · {{ event.eventType }}
                          @if (event.storeId) {
                            · {{ getStoreName(event.storeId) }}
                          } @else {
                            · All Stores
                          }
                        </p>
                        <p class="text-slate-400 text-sm mt-1">
                          {{ event.description }}
                        </p>
                      </div>
                      <div class="flex gap-2">
                        <button
                          (click)="startEdit(event)"
                          class="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-sm transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deleteEvent(event.id)"
                          class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div class="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p class="text-slate-400">📅 Start Date</p>
                        <p class="text-white font-semibold">{{ formatDate(event.startDate) }}</p>
                      </div>
                      <div>
                        <p class="text-slate-400">👥 Players</p>
                        <p class="text-white font-semibold">{{ event.currentPlayers }}/{{ event.maxPlayers || '∞' }}</p>
                      </div>
                      <div>
                        <p class="text-slate-400">💰 Prize Pool</p>
                        <p class="text-green-400 font-semibold">\${{ event.prizePool || '0' }}</p>
                      </div>
                    </div>
                    <button
                      (click)="openResultsModal(event)"
                      class="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white text-sm transition-colors"
                    >
                      📊 Manage Results
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </main>

      <!-- Create Event Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur">
              <h2 class="text-2xl font-bold text-white">Create Event</h2>
            </div>
            <form [formGroup]="eventForm" (ngSubmit)="addEvent()" class="p-6">
              <div class="space-y-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Select Store</label>
                  <select
                    formControlName="storeId"
                    class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">All Stores (Global Event)</option>
                    @for (store of stores(); track store.id) {
                      <option [value]="store.id">{{ store.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Event Title</label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Tournament Name"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Game</label>
                    <input
                      type="text"
                      formControlName="game"
                      placeholder="e.g., League of Legends"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Event Type</label>
                    <select
                      formControlName="eventType"
                      class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="tournament">Tournament</option>
                      <option value="league">League</option>
                      <option value="friendly">Friendly</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Start Date</label>
                    <input
                      type="datetime-local"
                      formControlName="startDate"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">End Date</label>
                    <input
                      type="datetime-local"
                      formControlName="endDate"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Prize Pool ($)</label>
                    <input
                      type="number"
                      formControlName="prizePool"
                      placeholder="0.00"
                      step="0.01"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Max Players</label>
                    <input
                      type="number"
                      formControlName="maxPlayers"
                      placeholder="32"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Status</label>
                    <select
                      formControlName="status"
                      class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Description</label>
                  <textarea
                    formControlName="description"
                    placeholder="Event details..."
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-24"
                  ></textarea>
                </div>
              </div>
              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="!eventForm.valid || isLoading()"
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {{ isLoading() ? 'Creating...' : 'Create Event' }}
                </button>
                <button
                  type="button"
                  (click)="showCreateModal.set(false); eventForm.reset()"
                  class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Event Modal -->
      @if (editingId()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur">
              <h2 class="text-2xl font-bold text-white">Edit Event</h2>
            </div>
            <form [formGroup]="editForm" (ngSubmit)="updateEvent()" class="p-6">
              <div class="space-y-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Select Store</label>
                  <select
                    formControlName="storeId"
                    class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">All Stores (Global Event)</option>
                    @for (store of stores(); track store.id) {
                      <option [value]="store.id">{{ store.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Event Title</label>
                  <input
                    type="text"
                    formControlName="title"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Game</label>
                    <input
                      type="text"
                      formControlName="game"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Event Type</label>
                    <select
                      formControlName="eventType"
                      class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="tournament">Tournament</option>
                      <option value="league">League</option>
                      <option value="friendly">Friendly</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Start Date</label>
                    <input
                      type="datetime-local"
                      formControlName="startDate"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">End Date</label>
                    <input
                      type="datetime-local"
                      formControlName="endDate"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Prize Pool ($)</label>
                    <input
                      type="number"
                      formControlName="prizePool"
                      step="0.01"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Max Players</label>
                    <input
                      type="number"
                      formControlName="maxPlayers"
                      class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-semibold mb-2">Status</label>
                    <select
                      formControlName="status"
                      class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Description</label>
                  <textarea
                    formControlName="description"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 h-24"
                  ></textarea>
                </div>
              </div>
              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="!editForm.valid || isLoading()"
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {{ isLoading() ? 'Saving...' : 'Save Changes' }}
                </button>
                <button
                  type="button"
                  (click)="cancelEdit()"
                  class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Results Modal -->
      @if (showResultsModal() && selectedEventForResults()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>📊</span>
                <h2 class="text-2xl font-bold text-white">Results — {{ selectedEventForResults()!.title }}</h2>
              </div>
              <button
                (click)="showResultsModal.set(false)"
                class="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <form [formGroup]="resultForm" (ngSubmit)="addResult()" class="p-6">
              <div class="bg-white/5 border border-cyan-400/30 rounded-lg p-4 mb-6">
                <h3 class="text-white font-bold mb-4">Add Result</h3>
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Player Username</label>
                      <select
                        formControlName="playerUsername"
                        class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                      >
                        <option value="">Select player</option>
                        @for (user of availableUsers(); track user.id) {
                          <option [value]="user.email || user.cellphone || user.id">{{ user.email || user.cellphone }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Result</label>
                      <select
                        formControlName="result"
                        class="w-full px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                      >
                        <option value="">Select result</option>
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                        <option value="draw">Draw</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Placement</label>
                      <input
                        type="number"
                        formControlName="placement"
                        placeholder="1"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Score</label>
                      <input
                        type="text"
                        formControlName="score"
                        placeholder="Score"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Points Earned</label>
                      <input
                        type="number"
                        formControlName="pointsEarned"
                        placeholder="0"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Kills</label>
                      <input
                        type="number"
                        formControlName="kills"
                        placeholder="0"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Deaths</label>
                      <input
                        type="number"
                        formControlName="deaths"
                        placeholder="0"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Assists</label>
                      <input
                        type="number"
                        formControlName="assists"
                        placeholder="0"
                        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2 pt-2">
                    <button
                      type="submit"
                      [disabled]="!resultForm.valid || isLoadingResults()"
                      class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {{ isLoadingResults() ? 'Adding...' : 'Add Result' }}
                    </button>
                    <button
                      type="button"
                      (click)="resultForm.reset()"
                      class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <!-- Results List -->
            <div class="p-6 border-t border-white/10">
              <h3 class="text-white font-bold mb-3">{{ eventResults().length }} Results Recorded</h3>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                @if (eventResults().length === 0) {
                  <p class="text-slate-400">No results yet</p>
                } @else {
                  @for (result of eventResults(); track result.id) {
                    <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div class="flex-1">
                        <p class="text-white font-semibold">{{ result.playerUsername }}</p>
                        <p class="text-slate-400 text-sm">
                          {{ result.result }} · Place #{{ result.placement || '—' }} · K: {{ result.kills }}/D: {{ result.deaths }}/A: {{ result.assists }}
                        </p>
                      </div>
                      <button
                        (click)="deleteResult(result.id)"
                        class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  }
                }
              </div>
            </div>

            <div class="flex gap-3 p-6 border-t border-white/10">
              <button
                (click)="showResultsModal.set(false)"
                class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class EventsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  eventForm: FormGroup;
  editForm: FormGroup;
  resultForm: FormGroup;

  stores = signal<Store[]>([]);
  events = signal<Event[]>([]);
  eventResults = signal<EventResult[]>([]);
  availableUsers = signal<User[]>([]);
  activeStatusFilter = signal<StatusFilter>('all');
  selectedEventForResults = signal<Event | null>(null);

  isLoading = signal(false);
  isLoadingResults = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  showCreateModal = signal(false);
  showResultsModal = signal(false);

  filteredEvents = computed(() => {
    const filter = this.activeStatusFilter();
    if (filter === 'all') {
      return this.events();
    }
    return this.events().filter((e) => e.status === filter);
  });

  constructor() {
    this.eventForm = this.fb.group({
      storeId: [''],
      title: ['', [Validators.required, Validators.minLength(2)]],
      game: [''],
      eventType: ['tournament'],
      startDate: ['', Validators.required],
      endDate: [''],
      prizePool: [''],
      maxPlayers: [''],
      status: ['upcoming'],
      description: [''],
    });

    this.editForm = this.fb.group({
      storeId: [''],
      title: ['', [Validators.required, Validators.minLength(2)]],
      game: [''],
      eventType: ['tournament'],
      startDate: ['', Validators.required],
      endDate: [''],
      prizePool: [''],
      maxPlayers: [''],
      status: ['upcoming'],
      description: [''],
    });

    this.resultForm = this.fb.group({
      playerUsername: ['', Validators.required],
      result: ['', Validators.required],
      placement: [''],
      score: [''],
      pointsEarned: [''],
      kills: [0],
      deaths: [0],
      assists: [0],
    });
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadEvents();
  }

  getStoreName(storeId: string): string {
    const store = this.stores().find(s => s.id === storeId);
    return store ? store.name : 'Unknown Store';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'inline-block px-2 py-1 rounded text-xs font-semibold';
    switch (status) {
      case 'upcoming':
        return `${baseClass} bg-blue-600/30 text-blue-300 border border-blue-500/50`;
      case 'live':
        return `${baseClass} bg-red-600/30 text-red-300 border border-red-500/50`;
      case 'completed':
        return `${baseClass} bg-green-600/30 text-green-300 border border-green-500/50`;
      case 'cancelled':
        return `${baseClass} bg-gray-600/30 text-gray-300 border border-gray-500/50`;
      default:
        return baseClass;
    }
  }

  addEvent(): void {
    if (!this.eventForm.valid) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.eventForm.value;
    const payload = {
      storeId: formValue.storeId || undefined,
      title: formValue.title,
      game: formValue.game || undefined,
      eventType: formValue.eventType,
      startDate: formValue.startDate,
      endDate: formValue.endDate || undefined,
      prizePool: formValue.prizePool ? parseFloat(formValue.prizePool).toString() : undefined,
      maxPlayers: formValue.maxPlayers ? parseInt(formValue.maxPlayers) : undefined,
      status: formValue.status,
      description: formValue.description || undefined,
    };

    this.http
      .post<{ data: Event }>(`${environment.apiUrl}/api/events`, payload)
      .subscribe({
        next: () => {
          this.eventForm.reset();
          this.showCreateModal.set(false);
          this.successMessage.set('Event created successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadEvents();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to add event:', err);
          this.errorMessage.set(err.error?.error || 'Failed to create event');
          this.isLoading.set(false);
        },
      });
  }

  startEdit(event: Event): void {
    this.editingId.set(event.id);
    this.editForm.patchValue({
      storeId: event.storeId || '',
      title: event.title,
      game: event.game || '',
      eventType: event.eventType,
      startDate: this.toDateTimeLocal(event.startDate),
      endDate: event.endDate ? this.toDateTimeLocal(event.endDate) : '',
      prizePool: event.prizePool || '',
      maxPlayers: event.maxPlayers || '',
      status: event.status,
      description: event.description || '',
    });
  }

  updateEvent(): void {
    if (!this.editForm.valid || !this.editingId()) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.editForm.value;
    const payload = {
      storeId: formValue.storeId || undefined,
      title: formValue.title,
      game: formValue.game || undefined,
      eventType: formValue.eventType,
      startDate: formValue.startDate,
      endDate: formValue.endDate || undefined,
      prizePool: formValue.prizePool ? parseFloat(formValue.prizePool).toString() : undefined,
      maxPlayers: formValue.maxPlayers ? parseInt(formValue.maxPlayers) : undefined,
      status: formValue.status,
      description: formValue.description || undefined,
    };

    this.http
      .put<{ data: Event }>(
        `${environment.apiUrl}/api/events/${this.editingId()}`,
        payload,
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Event updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.editingId.set(null);
          this.loadEvents();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to update event:', err);
          this.errorMessage.set(err.error?.error || 'Failed to update event');
          this.isLoading.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  deleteEvent(id: string): void {
    if (!confirm('Are you sure you want to delete this event?')) return;

    this.http.delete(`${environment.apiUrl}/api/events/${id}`).subscribe({
      next: () => {
        this.successMessage.set('Event deleted successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadEvents();
      },
      error: (err) => {
        console.error('Failed to delete event:', err);
        this.errorMessage.set('Failed to delete event');
      },
    });
  }

  openResultsModal(event: Event): void {
    this.selectedEventForResults.set(event);
    this.showResultsModal.set(true);
    this.loadEventResults(event.id);
    this.loadAvailableUsers(event.storeId);
  }

  addResult(): void {
    if (!this.resultForm.valid || !this.selectedEventForResults()) return;

    this.isLoadingResults.set(true);
    const eventId = this.selectedEventForResults()!.id;
    const payload = this.resultForm.value;

    this.http
      .post<{ data: EventResult }>(
        `${environment.apiUrl}/api/events/${eventId}/results`,
        payload,
      )
      .subscribe({
        next: () => {
          this.resultForm.reset({ kills: 0, deaths: 0, assists: 0 });
          this.loadEventResults(eventId);
          this.isLoadingResults.set(false);
        },
        error: (err) => {
          console.error('Failed to add result:', err);
          this.isLoadingResults.set(false);
        },
      });
  }

  deleteResult(resultId: string): void {
    if (!confirm('Delete this result?')) return;

    const eventId = this.selectedEventForResults()?.id;
    if (!eventId) return;

    this.http
      .delete(`${environment.apiUrl}/api/events/${eventId}/results/${resultId}`)
      .subscribe({
        next: () => {
          this.loadEventResults(eventId);
        },
        error: (err) => {
          console.error('Failed to delete result:', err);
        },
      });
  }

  private loadStores(): void {
    this.http
      .get<{ data: Store[] }>(`${environment.apiUrl}/api/stores`)
      .subscribe({
        next: (response) => {
          this.stores.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load stores:', err);
        },
      });
  }

  private loadEvents(): void {
    this.http
      .get<{ data: Event[] }>(`${environment.apiUrl}/api/events`)
      .subscribe({
        next: (response) => {
          this.events.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load events:', err);
          this.errorMessage.set('Failed to load events');
        },
      });
  }

  private loadEventResults(eventId: string): void {
    this.http
      .get<{ data: EventResult[] }>(
        `${environment.apiUrl}/api/events/${eventId}/results`,
      )
      .subscribe({
        next: (response) => {
          this.eventResults.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load results:', err);
        },
      });
  }

  private loadAvailableUsers(storeId?: string): void {
    // For now, we'll load all players. In production, you might filter by store
    this.http
      .get<{ data: User[] }>(`${environment.apiUrl}/api/players`)
      .subscribe({
        next: (response) => {
          this.availableUsers.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load players:', err);
          // Fallback to empty list
          this.availableUsers.set([]);
        },
      });
  }

  private toDateTimeLocal(dateString: string): string {
    try {
      const date = new Date(dateString);
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return (
        date.getFullYear() +
        '-' +
        pad(date.getMonth() + 1) +
        '-' +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        ':' +
        pad(date.getMinutes())
      );
    } catch {
      return dateString;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
