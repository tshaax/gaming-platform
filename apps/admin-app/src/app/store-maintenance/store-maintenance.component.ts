import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

interface Store {
  id: string;
  name: string;
  slug: string;
  address?: string;
  taxNumber?: string;
  manager?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GamingStation {
  id: string;
  storeId: string;
  name: string;
  isActive: boolean;
}

interface DurationOption {
  id: string;
  storeId: string;
  minutes: number;
  isActive: boolean;
}

interface RateOption {
  id: string;
  storeId: string;
  ratePerHour: string;
  label?: string;
  isActive: boolean;
}

type TabType = 'stores' | 'stations' | 'durations' | 'rates';

@Component({
  selector: 'app-store-maintenance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <!-- Left Sidebar -->
      <aside class="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col">
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2 cursor-pointer" (click)="goBack()">
            <span class="text-lg">←</span>
            <h2 class="text-white font-bold">Back to Dashboard</h2>
          </div>
        </div>
        <nav class="flex-1">
          <h3 class="text-white font-bold text-sm mb-4">Maintenance</h3>
          <div class="space-y-2">
            <div (click)="goToCashiers()" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
              <span class="text-lg">👔</span>
              <span>Cashiers</span>
            </div>
            <div class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3">
              <span class="text-lg">🏪</span>
              <span>Stores</span>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Top Header -->
        <header class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Store Management</h1>
            <p class="text-slate-400 text-sm">Create and manage gaming stores, stations, and rates</p>
          </div>
          <button (click)="activeTab() === 'stores' ? showCreateModal.set(true) : null" *ngIf="activeTab() === 'stores'" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
            <span>➕</span>
            <span>Add Store</span>
          </button>
        </header>

        <!-- Tab Navigation -->
        <div class="bg-black/40 border-b border-white/10 px-8 flex gap-0">
          <button (click)="activeTab.set('stores')" [class.border-b-2]="activeTab() === 'stores'" [class.border-cyan-400]="activeTab() === 'stores'" class="px-6 py-4 text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold">
            <span>🏪</span>
            <span>Stores</span>
          </button>
          <button (click)="activeTab.set('stations')" [class.border-b-2]="activeTab() === 'stations'" [class.border-cyan-400]="activeTab() === 'stations'" class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold">
            <span>🖥️</span>
            <span>Stations</span>
          </button>
          <button (click)="activeTab.set('durations')" [class.border-b-2]="activeTab() === 'durations'" [class.border-cyan-400]="activeTab() === 'durations'" class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold">
            <span>⏱️</span>
            <span>Durations</span>
          </button>
          <button (click)="activeTab.set('rates')" [class.border-b-2]="activeTab() === 'rates'" [class.border-cyan-400]="activeTab() === 'rates'" class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold">
            <span>💰</span>
            <span>Rates</span>
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-auto">
          <!-- Stores Tab -->
          @if (activeTab() === 'stores') {
            <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">Stores List</h2>
                <div class="flex items-center gap-2">
                  <div class="flex gap-2 bg-white/10 rounded-lg p-1">
                    <button (click)="viewMode.set('cards')" [class.bg-cyan-600]="viewMode() === 'cards'" [class.text-cyan-400]="viewMode() !== 'cards'" class="px-2 py-1 rounded text-lg transition-colors text-white font-medium" title="Cards View">
                      📇
                    </button>
                    <button (click)="viewMode.set('table')" [class.bg-cyan-600]="viewMode() === 'table'" [class.text-cyan-400]="viewMode() !== 'table'" class="px-2 py-1 rounded text-lg transition-colors text-white font-medium" title="Table View">
                      📊
                    </button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex gap-2">
                  <input type="text" [value]="filterText()" (input)="filterText.set($any($event.target).value)" placeholder="Filter by name or address..." class="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50" />
                  <button (click)="filterText.set('')" class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors">
                    Clear
                  </button>
                </div>
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
                Showing {{ (currentPageItems().length) }} of {{ filteredStores().length }} stores
                @if (totalPages() > 1) {
                  <span> | Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
                }
              </div>

              <!-- Cards View -->
              @if (viewMode() === 'cards') {
                <div class="space-y-4 mb-6">
                  @if (currentPageItems().length === 0) {
                    <div class="text-center py-12">
                      <p class="text-slate-400 text-lg">{{ filteredStores().length === 0 ? 'No stores created yet' : 'No results found' }}</p>
                    </div>
                  } @else {
                    @for (store of currentPageItems(); track store.id) {
                      <div class="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-400/50 transition-all">
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex-1">
                            <h3 class="text-white font-bold text-lg">{{ store.name }}</h3>
                            <p class="text-slate-400 text-sm">📍 {{ store.address }}</p>
                          </div>
                          <div class="flex gap-2">
                            <button (click)="startEdit(store)" class="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-sm transition-colors whitespace-nowrap">
                              Edit
                            </button>
                            <button (click)="deleteStore(store.id)" class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors whitespace-nowrap">
                              Delete
                            </button>
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p class="text-slate-400">Manager</p>
                            <p class="text-white font-semibold">{{ store.manager || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-slate-400">Contact</p>
                            <p class="text-white font-semibold">{{ store.contactPerson || '-' }}</p>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              <!-- Pagination -->
              @if (totalPages() > 1) {
                <div class="flex items-center justify-between pt-4 border-t border-white/10">
                  <button (click)="previousPage()" [disabled]="currentPage() === 0" class="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors">
                    ← Previous
                  </button>
                  <div class="flex gap-2">
                    @for (page of pageNumbers(); track page) {
                      <button (click)="goToPage(page)" [class.bg-cyan-600]="currentPage() === page" [class.bg-white/10]="currentPage() !== page" class="px-3 py-1 border border-white/20 rounded text-white transition-colors">
                        {{ page + 1 }}
                      </button>
                    }
                  </div>
                  <button (click)="nextPage()" [disabled]="currentPage() >= totalPages() - 1" class="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors">
                    Next →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Stations Tab -->
          @if (activeTab() === 'stations') {
            <div class="max-w-2xl">
              <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">Manage Gaming Stations</h2>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Select Store</label>
                      <select (change)="selectedStoreForSettings.set($any($event.target).value)" [value]="selectedStoreForSettings()" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400">
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <h3 class="text-white font-bold mb-4">Add New Station</h3>
                        <form [formGroup]="stationForm" (ngSubmit)="addStation()" class="space-y-4">
                          <div>
                            <label class="block text-slate-300 text-sm font-semibold mb-2">Station Name</label>
                            <input type="text" formControlName="name" placeholder="Station 1" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                          </div>
                          <button type="submit" [disabled]="!stationForm.valid || isLoadingSettings()" class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                            {{ isLoadingSettings() ? 'Adding...' : 'Add Station' }}
                          </button>
                        </form>

                        <div class="mt-8 pt-6 border-t border-white/10">
                          <h3 class="text-white font-bold mb-4">Existing Stations</h3>
                          <div class="space-y-3">
                            @if (stations().length === 0) {
                              <p class="text-slate-400">No stations yet</p>
                            } @else {
                              @for (station of stations(); track station.id) {
                                <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                                  <span class="text-white font-semibold">{{ station.name }}</span>
                                  <button (click)="deleteStation(station.id)" class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors">
                                    Delete
                                  </button>
                                </div>
                              }
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Durations Tab -->
          @if (activeTab() === 'durations') {
            <div class="max-w-2xl">
              <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">Manage Duration Options</h2>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Select Store</label>
                      <select (change)="selectedStoreForSettings.set($any($event.target).value)" [value]="selectedStoreForSettings()" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400">
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <h3 class="text-white font-bold mb-4">Add Duration Option</h3>
                        <form [formGroup]="durationForm" (ngSubmit)="addDuration()" class="space-y-4">
                          <div>
                            <label class="block text-slate-300 text-sm font-semibold mb-2">Minutes</label>
                            <input type="number" formControlName="minutes" placeholder="30" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                          </div>
                          <button type="submit" [disabled]="!durationForm.valid || isLoadingSettings()" class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                            {{ isLoadingSettings() ? 'Adding...' : 'Add Duration' }}
                          </button>
                        </form>

                        <div class="mt-8 pt-6 border-t border-white/10">
                          <h3 class="text-white font-bold mb-4">Available Durations</h3>
                          <div class="space-y-3">
                            @if (durations().length === 0) {
                              <p class="text-slate-400">No durations yet</p>
                            } @else {
                              @for (duration of durations(); track duration.id) {
                                <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                                  <span class="text-white font-semibold">{{ duration.minutes }} minutes</span>
                                  <button (click)="deleteDuration(duration.id)" class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors">
                                    Delete
                                  </button>
                                </div>
                              }
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Rates Tab -->
          @if (activeTab() === 'rates') {
            <div class="max-w-2xl">
              <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">Manage Rate Options</h2>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-slate-300 text-sm font-semibold mb-2">Select Store</label>
                      <select (change)="selectedStoreForSettings.set($any($event.target).value)" [value]="selectedStoreForSettings()" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400">
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <h3 class="text-white font-bold mb-4">Add Rate Option</h3>
                        <form [formGroup]="rateForm" (ngSubmit)="addRate()" class="space-y-4">
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <label class="block text-slate-300 text-sm font-semibold mb-2">Rate/hr ($)</label>
                              <input type="number" formControlName="ratePerHour" placeholder="10.00" step="0.01" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                            </div>
                            <div>
                              <label class="block text-slate-300 text-sm font-semibold mb-2">Label (optional)</label>
                              <input type="text" formControlName="label" placeholder="Premium" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                            </div>
                          </div>
                          <button type="submit" [disabled]="!rateForm.valid || isLoadingSettings()" class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                            {{ isLoadingSettings() ? 'Adding...' : 'Add Rate' }}
                          </button>
                        </form>

                        <div class="mt-8 pt-6 border-t border-white/10">
                          <h3 class="text-white font-bold mb-4">Available Rates</h3>
                          <div class="space-y-3">
                            @if (rates().length === 0) {
                              <p class="text-slate-400">No rates yet</p>
                            } @else {
                              @for (rate of rates(); track rate.id) {
                                <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                                  <span class="text-white font-semibold">
                                    ${{ rate.ratePerHour }}/hr
                                    @if (rate.label) {
                                      <span class="text-slate-400 text-sm">({{ rate.label }})</span>
                                    }
                                  </span>
                                  <button (click)="deleteRate(rate.id)" class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors">
                                    Delete
                                  </button>
                                </div>
                              }
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Create Store Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur">
              <h2 class="text-2xl font-bold text-white">Create New Store</h2>
            </div>
            <form [formGroup]="form" (ngSubmit)="addStore()" class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Store Name</label>
                  <input type="text" formControlName="name" placeholder="Main Gaming Hub" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Store Slug</label>
                  <input type="text" formControlName="slug" placeholder="main-gaming-hub" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Address</label>
                  <input type="text" formControlName="address" placeholder="123 Gaming St, City" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Tax Number (Optional)</label>
                  <input type="text" formControlName="taxNumber" placeholder="123456789" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Manager Name</label>
                  <input type="text" formControlName="manager" placeholder="John Manager" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Contact Person</label>
                  <input type="text" formControlName="contactPerson" placeholder="Jane Contact" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button type="submit" [disabled]="!form.valid || isLoading()" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                  {{ isLoading() ? 'Creating...' : 'Create Store' }}
                </button>
                <button type="button" (click)="showCreateModal.set(false); form.reset()" class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Store Modal -->
      @if (editingId()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur">
              <h2 class="text-2xl font-bold text-white">Edit Store</h2>
            </div>
            <form [formGroup]="editForm" (ngSubmit)="updateStore()" class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Store Name</label>
                  <input type="text" formControlName="name" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Store Slug</label>
                  <input type="text" formControlName="slug" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Address</label>
                  <input type="text" formControlName="address" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Tax Number (Optional)</label>
                  <input type="text" formControlName="taxNumber" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Manager Name</label>
                  <input type="text" formControlName="manager" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2">Contact Person</label>
                  <input type="text" formControlName="contactPerson" class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button type="submit" [disabled]="!editForm.valid || isLoading()" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                  {{ isLoading() ? 'Saving...' : 'Save Changes' }}
                </button>
                <button type="button" (click)="cancelEdit()" class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class StoreMaintenanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  form: FormGroup;
  editForm: FormGroup;
  stationForm: FormGroup;
  durationForm: FormGroup;
  rateForm: FormGroup;

  stores = signal<Store[]>([]);
  stations = signal<GamingStation[]>([]);
  durations = signal<DurationOption[]>([]);
  rates = signal<RateOption[]>([]);

  isLoading = signal(false);
  isLoadingSettings = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  showCreateModal = signal(false);

  activeTab = signal<TabType>('stores');
  selectedStoreForSettings = signal<string>('');

  filterText = signal('');
  viewMode = signal<'cards' | 'table'>('cards');
  currentPage = signal(0);
  itemsPerPage = 5;

  filteredStores = computed(() => {
    const text = this.filterText().toLowerCase();
    return this.stores().filter((s) => {
      const matchesText = !text || s.name.toLowerCase().includes(text) || (s.address?.toLowerCase().includes(text) ?? false);
      return matchesText;
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredStores().length / this.itemsPerPage));

  currentPageItems = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStores().slice(start, end);
  });

  pageNumbers = computed(() => {
    const pages = [];
    for (let i = 0; i < this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.minLength(2)]],
      address: [''],
      taxNumber: [''],
      manager: [''],
      contactPerson: [''],
      contactPhone: [''],
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.minLength(2)]],
      address: [''],
      taxNumber: [''],
      manager: [''],
      contactPerson: [''],
      contactPhone: [''],
    });

    this.stationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.durationForm = this.fb.group({
      minutes: ['', [Validators.required, Validators.min(1)]],
    });

    this.rateForm = this.fb.group({
      ratePerHour: ['', [Validators.required, Validators.min(0)]],
      label: [''],
    });
  }

  ngOnInit(): void {
    this.loadStores();
  }

  addStation(): void {
    if (!this.stationForm.valid || !this.selectedStoreForSettings()) return;
    this.isLoadingSettings.set(true);

    const { name } = this.stationForm.value;
    this.http.post(`http://localhost:3333/api/gaming-sessions/stations`, {
      name,
    }).subscribe({
      next: () => {
        this.stationForm.reset();
        this.successMessage.set('Station added successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadStations();
        this.isLoadingSettings.set(false);
      },
      error: (err) => {
        console.error('Failed to add station:', err);
        this.errorMessage.set('Failed to add station');
        this.isLoadingSettings.set(false);
      },
    });
  }

  deleteStation(stationId: string): void {
    if (!confirm('Delete this station?')) return;
    this.http.delete(`http://localhost:3333/api/gaming-sessions/stations/${stationId}`).subscribe({
      next: () => {
        this.loadStations();
      },
      error: (err) => {
        console.error('Failed to delete station:', err);
      },
    });
  }

  addDuration(): void {
    if (!this.durationForm.valid || !this.selectedStoreForSettings()) return;
    this.isLoadingSettings.set(true);

    const { minutes } = this.durationForm.value;
    this.http.post(`http://localhost:3333/api/gaming-sessions/durations`, {
      minutes: parseInt(minutes),
    }).subscribe({
      next: () => {
        this.durationForm.reset();
        this.successMessage.set('Duration added successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadDurations();
        this.isLoadingSettings.set(false);
      },
      error: (err) => {
        console.error('Failed to add duration:', err);
        this.errorMessage.set('Failed to add duration');
        this.isLoadingSettings.set(false);
      },
    });
  }

  deleteDuration(durationId: string): void {
    if (!confirm('Delete this duration?')) return;
    this.http.delete(`http://localhost:3333/api/gaming-sessions/durations/${durationId}`).subscribe({
      next: () => {
        this.loadDurations();
      },
      error: (err) => {
        console.error('Failed to delete duration:', err);
      },
    });
  }

  addRate(): void {
    if (!this.rateForm.valid || !this.selectedStoreForSettings()) return;
    this.isLoadingSettings.set(true);

    const { ratePerHour, label } = this.rateForm.value;
    this.http.post(`http://localhost:3333/api/gaming-sessions/rates`, {
      ratePerHour: parseFloat(ratePerHour).toString(),
      label: label || undefined,
    }).subscribe({
      next: () => {
        this.rateForm.reset();
        this.successMessage.set('Rate added successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadRates();
        this.isLoadingSettings.set(false);
      },
      error: (err) => {
        console.error('Failed to add rate:', err);
        this.errorMessage.set('Failed to add rate');
        this.isLoadingSettings.set(false);
      },
    });
  }

  deleteRate(rateId: string): void {
    if (!confirm('Delete this rate?')) return;
    this.http.delete(`http://localhost:3333/api/gaming-sessions/rates/${rateId}`).subscribe({
      next: () => {
        this.loadRates();
      },
      error: (err) => {
        console.error('Failed to delete rate:', err);
      },
    });
  }

  addStore(): void {
    if (!this.form.valid) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.post<{ data: Store }>('http://localhost:3333/api/stores', this.form.value).subscribe({
      next: () => {
        this.form.reset();
        this.showCreateModal.set(false);
        this.successMessage.set('Store created successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadStores();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to add store:', err);
        this.errorMessage.set(err.error?.error || 'Failed to create store');
        this.isLoading.set(false);
      },
    });
  }

  startEdit(store: Store): void {
    this.editingId.set(store.id);
    this.editForm.patchValue({
      name: store.name,
      slug: store.slug,
      address: store.address || '',
      taxNumber: store.taxNumber || '',
      manager: store.manager || '',
      contactPerson: store.contactPerson || '',
      contactPhone: store.contactPhone || '',
    });
  }

  updateStore(): void {
    if (!this.editForm.valid || !this.editingId()) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put<{ data: Store }>(`http://localhost:3333/api/stores/${this.editingId()}`, this.editForm.value).subscribe({
      next: () => {
        this.successMessage.set('Store updated successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.editingId.set(null);
        this.loadStores();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to update store:', err);
        this.errorMessage.set(err.error?.error || 'Failed to update store');
        this.isLoading.set(false);
      },
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  deleteStore(id: string): void {
    if (!confirm('Are you sure you want to delete this store?')) return;

    this.http.delete(`http://localhost:3333/api/stores/${id}`).subscribe({
      next: () => {
        this.successMessage.set('Store deleted successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadStores();
      },
      error: (err) => {
        console.error('Failed to delete store:', err);
        this.errorMessage.set('Failed to delete store');
      },
    });
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  private loadStores(): void {
    this.http.get<{ data: Store[] }>('http://localhost:3333/api/stores').subscribe({
      next: (response) => {
        this.stores.set(response.data);
        this.currentPage.set(0);
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
        this.errorMessage.set('Failed to load stores');
      },
    });
  }

  private loadStations(): void {
    if (!this.selectedStoreForSettings()) return;
    this.http.get<{ data: GamingStation[] }>(`http://localhost:3333/api/gaming-sessions/stations/${this.selectedStoreForSettings()}`).subscribe({
      next: (response) => {
        this.stations.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load stations:', err);
      },
    });
  }

  private loadDurations(): void {
    if (!this.selectedStoreForSettings()) return;
    this.http.get<{ data: DurationOption[] }>(`http://localhost:3333/api/gaming-sessions/durations/${this.selectedStoreForSettings()}`).subscribe({
      next: (response) => {
        this.durations.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load durations:', err);
      },
    });
  }

  private loadRates(): void {
    if (!this.selectedStoreForSettings()) return;
    this.http.get<{ data: RateOption[] }>(`http://localhost:3333/api/gaming-sessions/rates/${this.selectedStoreForSettings()}`).subscribe({
      next: (response) => {
        this.rates.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load rates:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToCashiers(): void {
    this.router.navigate(['/cashiers']);
  }
}
