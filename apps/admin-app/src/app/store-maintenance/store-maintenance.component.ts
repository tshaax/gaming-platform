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

interface PricingOption {
  id: string;
  storeId: string;
  durationMins: number;
  ratePerHour: string;
  label?: string;
  isActive: boolean;
}

interface Game {
  id: string;
  storeId: string;
  name: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Player {
  id: string;
  email?: string;
  cellphone?: string;
  stores: Array<{ id: string; name: string; role: string }>;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'stores' | 'stations' | 'pricing' | 'games' | 'players';

@Component({
  selector: 'app-store-maintenance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden"
    >
      <!-- Left Sidebar -->
      <aside
        class="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col flex-shrink-0 overflow-y-auto"
      >
        <div class="mb-8">
          <div
            class="flex items-center gap-3 mb-2 cursor-pointer"
            (click)="goBack()"
          >
            <span class="text-lg">←</span>
            <h2 class="text-white font-bold">Back to Dashboard</h2>
          </div>
        </div>
        <nav class="flex-1">
          <h3 class="text-white font-bold text-sm mb-4">Maintenance</h3>
          <div class="space-y-2">
            <div
              (click)="goToCashiers()"
              class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
            >
              <span class="text-lg">👔</span>
              <span>Cashiers</span>
            </div>
            <div
              class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3"
            >
              <span class="text-lg">🏪</span>
              <span>Stores</span>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header -->
        <header
          class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between"
        >
          <div>
            <h1 class="text-3xl font-bold text-white">Store Management</h1>
            <p class="text-slate-400 text-sm">
              Create and manage gaming stores, stations, and rates
            </p>
          </div>
          <button
            (click)="
              activeTab() === 'stores' ? showCreateModal.set(true) : null
            "
            *ngIf="activeTab() === 'stores'"
            class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Store</span>
          </button>
        </header>

        <!-- Tab Navigation -->
        <div class="bg-black/40 border-b border-white/10 px-8 flex gap-0">
          <button
            (click)="activeTab.set('stores')"
            [class.border-b-2]="activeTab() === 'stores'"
            [class.border-cyan-400]="activeTab() === 'stores'"
            class="px-6 py-4 text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>🏪</span>
            <span>Stores</span>
          </button>
          <button
            (click)="activeTab.set('stations')"
            [class.border-b-2]="activeTab() === 'stations'"
            [class.border-cyan-400]="activeTab() === 'stations'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>🖥️</span>
            <span>Stations</span>
          </button>
          <button
            (click)="activeTab.set('pricing')"
            [class.border-b-2]="activeTab() === 'pricing'"
            [class.border-cyan-400]="activeTab() === 'pricing'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>⏱️💰</span>
            <span>Pricing & Duration</span>
          </button>
          <button
            (click)="activeTab.set('games')"
            [class.border-b-2]="activeTab() === 'games'"
            [class.border-cyan-400]="activeTab() === 'games'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>🎮</span>
            <span>Games</span>
          </button>
          <button
            (click)="activeTab.set('players')"
            [class.border-b-2]="activeTab() === 'players'"
            [class.border-cyan-400]="activeTab() === 'players'"
            class="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 font-semibold"
          >
            <span>👥</span>
            <span>Players</span>
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-y-auto overflow-x-hidden w-full">
          <!-- Stores Tab -->
          @if (activeTab() === 'stores') {
            <div
              class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">Stores List</h2>
                <div class="flex items-center gap-2">
                  <div class="flex gap-2 bg-white/10 rounded-lg p-1">
                    <button
                      (click)="viewMode.set('cards')"
                      [class.bg-cyan-600]="viewMode() === 'cards'"
                      [class.text-cyan-400]="viewMode() !== 'cards'"
                      class="px-2 py-1 rounded text-lg transition-colors text-white font-medium"
                      title="Cards View"
                    >
                      📇
                    </button>
                    <button
                      (click)="viewMode.set('table')"
                      [class.bg-cyan-600]="viewMode() === 'table'"
                      [class.text-cyan-400]="viewMode() !== 'table'"
                      class="px-2 py-1 rounded text-lg transition-colors text-white font-medium"
                      title="Table View"
                    >
                      📊
                    </button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex gap-2">
                  <input
                    type="text"
                    [value]="filterText()"
                    (input)="filterText.set($any($event.target).value)"
                    placeholder="Filter by name or address..."
                    class="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <button
                    (click)="filterText.set('')"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              @if (errorMessage()) {
                <div
                  class="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-4"
                >
                  <p class="text-red-200 text-sm">{{ errorMessage() }}</p>
                </div>
              }
              @if (successMessage()) {
                <div
                  class="bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-3 mb-4"
                >
                  <p class="text-green-200 text-sm">{{ successMessage() }}</p>
                </div>
              }

              <div class="text-slate-400 text-sm mb-4">
                Showing {{ currentPageItems().length }} of
                {{ filteredStores().length }} stores
                @if (totalPages() > 1) {
                  <span>
                    | Page {{ currentPage() + 1 }} of {{ totalPages() }}</span
                  >
                }
              </div>

              <!-- Cards View -->
              @if (viewMode() === 'cards') {
                <div class="space-y-4 mb-6">
                  @if (currentPageItems().length === 0) {
                    <div class="text-center py-12">
                      <p class="text-slate-400 text-lg">
                        {{
                          filteredStores().length === 0
                            ? 'No stores created yet'
                            : 'No results found'
                        }}
                      </p>
                    </div>
                  } @else {
                    @for (store of currentPageItems(); track store.id) {
                      <div
                        class="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-400/50 transition-all"
                      >
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex-1">
                            <h3 class="text-white font-bold text-lg">
                              {{ store.name }}
                            </h3>
                            <p class="text-slate-400 text-sm">
                              📍 {{ store.address }}
                            </p>
                          </div>
                          <div class="flex gap-2">
                            <button
                              (click)="startEdit(store)"
                              class="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-sm transition-colors whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              (click)="deleteStore(store.id)"
                              class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p class="text-slate-400">Manager</p>
                            <p class="text-white font-semibold">
                              {{ store.manager || '-' }}
                            </p>
                          </div>
                          <div>
                            <p class="text-slate-400">Contact</p>
                            <p class="text-white font-semibold">
                              {{ store.contactPerson || '-' }}
                            </p>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              <!-- Pagination -->
              @if (totalPages() > 1) {
                <div
                  class="flex items-center justify-between pt-4 border-t border-white/10"
                >
                  <button
                    (click)="previousPage()"
                    [disabled]="currentPage() === 0"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors"
                  >
                    ← Previous
                  </button>
                  <div class="flex gap-2">
                    @for (page of pageNumbers(); track page) {
                      <button
                        (click)="goToPage(page)"
                        [class.bg-cyan-600]="currentPage() === page"
                        [class.bg-white/10]="currentPage() !== page"
                        class="px-3 py-1 border border-white/20 rounded text-white transition-colors"
                      >
                        {{ page + 1 }}
                      </button>
                    }
                  </div>
                  <button
                    (click)="nextPage()"
                    [disabled]="currentPage() >= totalPages() - 1"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Next →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Stations Tab -->
          @if (activeTab() === 'stations') {
            <div class="max-w-2xl">
              <div
                class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">
                    Manage Gaming Stations
                  </h2>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-slate-300 text-sm font-semibold mb-2"
                        >Select Store</label
                      >
                      <select
                        (change)="
                          selectedStoreForSettings.set(
                            $any($event.target).value
                          );
                          loadStations()
                        "
                        [value]="selectedStoreForSettings()"
                        class="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <h3 class="text-white font-bold mb-4">
                          Add New Station
                        </h3>
                        <form
                          [formGroup]="stationForm"
                          (ngSubmit)="addStation()"
                          class="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div>
                            <label
                              class="block text-slate-300 text-sm font-semibold mb-2"
                              >Station Name
                              <span class="text-red-400">*</span></label
                            >
                            <input
                              type="text"
                              formControlName="name"
                              placeholder="Station 1"
                              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                            />
                            @if (
                              stationForm.get('name')?.hasError('required') &&
                              stationForm.get('name')?.touched
                            ) {
                              <p class="text-red-400 text-xs mt-1">
                                Station name is required
                              </p>
                            }
                          </div>
                          <button
                            type="submit"
                            [disabled]="
                              !stationForm.valid || isLoadingSettings()
                            "
                            class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                          >
                            {{
                              isLoadingSettings() ? 'Adding...' : 'Add Station'
                            }}
                          </button>
                        </form>

                        <div class="mt-8 pt-6 border-t border-white/10">
                          <h3 class="text-white font-bold mb-4">
                            Existing Stations
                          </h3>
                          <div class="space-y-3">
                            @if (stations().length === 0) {
                              <p class="text-slate-400 text-sm">
                                No stations for this store yet
                              </p>
                            } @else {
                              @for (station of stations(); track station.id) {
                                <div
                                  class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-400/50 transition-colors"
                                >
                                  <div>
                                    <span class="text-white font-semibold">{{
                                      station.name
                                    }}</span>
                                    <p class="text-slate-400 text-xs">
                                      ID: {{ station.id.slice(0, 8) }}...
                                    </p>
                                  </div>
                                  <button
                                    (click)="deleteStation(station.id)"
                                    class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors"
                                  >
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

          <!-- Pricing & Duration Tab -->
          @if (activeTab() === 'pricing') {
            <div class="w-full max-w-4xl">
              <div
                class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">
                    Manage Pricing & Duration
                  </h2>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-slate-300 text-sm font-semibold mb-2"
                        >Select Store</label
                      >
                      <select
                        (change)="
                          selectedStoreForSettings.set(
                            $any($event.target).value
                          );
                          loadPricingOptions()
                        "
                        [value]="selectedStoreForSettings()"
                        class="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <!-- Combined Form for Duration and Rate -->
                        <h3 class="text-white font-bold mb-4">
                          Add Duration & Rate Option
                        </h3>
                        <form
                          [formGroup]="pricingForm"
                          (ngSubmit)="addPricing()"
                          class="space-y-4 mb-8 p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div class="grid grid-cols-3 gap-4">
                            <div>
                              <label
                                class="block text-slate-300 text-sm font-semibold mb-2"
                                >Duration (minutes)
                                <span class="text-red-400">*</span></label
                              >
                              <input
                                type="number"
                                formControlName="durationMins"
                                placeholder="30"
                                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                              />
                              @if (
                                pricingForm
                                  .get('durationMins')
                                  ?.hasError('required') &&
                                pricingForm.get('durationMins')?.touched
                              ) {
                                <p class="text-red-400 text-xs mt-1">
                                  Duration is required
                                </p>
                              }
                            </div>
                            <div>
                              <label
                                class="block text-slate-300 text-sm font-semibold mb-2"
                                >Rate per minute(s)
                                <span class="text-red-400">*</span></label
                              >
                              <input
                                type="number"
                                formControlName="ratePerHour"
                                placeholder="10.00"
                                step="0.01"
                                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                              />
                              @if (
                                pricingForm
                                  .get('ratePerHour')
                                  ?.hasError('required') &&
                                pricingForm.get('ratePerHour')?.touched
                              ) {
                                <p class="text-red-400 text-xs mt-1">
                                  Rate is required
                                </p>
                              }
                            </div>
                            <div>
                              <label
                                class="block text-slate-300 text-sm font-semibold mb-2"
                                >Label (optional)</label
                              >
                              <input
                                type="text"
                                formControlName="label"
                                placeholder="Premium"
                                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            [disabled]="
                              !pricingForm.valid || isLoadingSettings()
                            "
                            class="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                          >
                            {{
                              isLoadingSettings()
                                ? 'Saving...'
                                : 'Add Pricing Package'
                            }}
                          </button>
                        </form>

                        <div>
                          <!-- Pricing Options Display -->
                          <h4 class="text-white font-bold mb-3">
                            Available Pricing Packages
                          </h4>
                          <div class="space-y-2">
                            @if (pricingOptions().length === 0) {
                              <p class="text-slate-400 text-sm">
                                No pricing packages yet
                              </p>
                            } @else {
                              @for (
                                pricing of pricingOptions();
                                track pricing.id
                              ) {
                                <div
                                  class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-400/50 transition-colors"
                                >
                                  <div class="flex-1">
                                    <span
                                      class="text-white font-semibold text-lg"
                                    >
                                      {{
                                        pricing.durationMins +
                                          ' minutes → ' +
                                          pricing.ratePerHour
                                      }}
                                    </span>
                                    @if (pricing.label) {
                                      <p class="text-slate-400 text-sm">
                                        Label: {{ pricing.label }}
                                      </p>
                                    }
                                  </div>
                                  <button
                                    (click)="deletePricingOption(pricing.id)"
                                    class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors whitespace-nowrap ml-4"
                                  >
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

          <!-- Games Tab -->
          @if (activeTab() === 'games') {
            <div class="w-full max-w-4xl">
              <div
                class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div class="mb-6">
                  <h2 class="text-xl font-bold text-white mb-4">
                    Manage Games
                  </h2>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-slate-300 text-sm font-semibold mb-2"
                        >Select Store</label
                      >
                      <select
                        (change)="
                          selectedStoreForSettings.set(
                            $any($event.target).value
                          );
                          loadGames();
                        "
                        [value]="selectedStoreForSettings()"
                        class="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">Choose a store...</option>
                        @for (store of stores(); track store.id) {
                          <option [value]="store.id">{{ store.name }}</option>
                        }
                      </select>
                    </div>

                    @if (selectedStoreForSettings()) {
                      <div class="pt-4 border-t border-white/10">
                        <h3 class="text-white font-bold mb-4">
                          {{ editingGameId() ? 'Edit Game' : 'Add New Game' }}
                        </h3>
                        <form
                          [formGroup]="gameForm"
                          (ngSubmit)="editingGameId() ? updateGame(editingGameId()!) : addGame()"
                          class="space-y-4 mb-8 p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                class="block text-slate-300 text-sm font-semibold mb-2"
                                >Game Name <span class="text-red-400">*</span></label
                              >
                              <input
                                type="text"
                                formControlName="name"
                                placeholder="e.g., Counter Strike 2"
                                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                              />
                              @if (gameForm.get('name')?.hasError('required') && gameForm.get('name')?.touched) {
                                <p class="text-red-400 text-xs mt-1">Game name is required</p>
                              }
                            </div>
                            <div>
                              <label
                                class="block text-slate-300 text-sm font-semibold mb-2"
                                >Thumbnail (JPG) <span class="text-red-400">*</span></label
                              >
                              <input
                                type="file"
                                accept="image/jpeg,image/png"
                                (change)="onGameImageSelect($event)"
                                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                              />
                              <p class="text-slate-400 text-xs mt-1">Max 500KB, will be compressed to 500x300px</p>
                            </div>
                          </div>

                          @if (gamePreviewUrl()) {
                            <div class="flex justify-center">
                              <div class="rounded-lg overflow-hidden border border-cyan-400/50 bg-black/30">
                                <img
                                  [src]="gamePreviewUrl()"
                                  alt="Game thumbnail preview"
                                  class="w-60 h-36 object-cover"
                                />
                              </div>
                            </div>
                          }

                          <div class="flex gap-2">
                            <button
                              type="submit"
                              [disabled]="!gameForm.valid || isLoadingSettings()"
                              class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                            >
                              {{ isLoadingSettings() ? 'Saving...' : (editingGameId() ? 'Update Game' : 'Add Game') }}
                            </button>
                            @if (editingGameId()) {
                              <button
                                type="button"
                                (click)="cancelEditGame()"
                                class="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            }
                          </div>
                        </form>

                        <div>
                          <h4 class="text-white font-bold mb-3">
                            Available Games
                          </h4>
                          <div class="grid grid-cols-1 gap-3">
                            @if (games().length === 0) {
                              <p class="text-slate-400 text-sm">No games configured for this store yet</p>
                            } @else {
                              @for (game of games(); track game.id) {
                                <div
                                  class="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-400/50 transition-colors"
                                >
                                  @if (game.thumbnail) {
                                    <img
                                      [src]="game.thumbnail"
                                      alt="{{ game.name }}"
                                      class="w-20 h-12 object-cover rounded"
                                    />
                                  } @else {
                                    <div class="w-20 h-12 bg-slate-600 rounded flex items-center justify-center text-slate-400">
                                      No image
                                    </div>
                                  }
                                  <div class="flex-1">
                                    <span class="text-white font-semibold text-lg">
                                      {{ game.name }}
                                    </span>
                                  </div>
                                  <div class="flex gap-2">
                                    <button
                                      (click)="editGame(game)"
                                      class="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-sm transition-colors whitespace-nowrap"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      (click)="deleteGame(game.id)"
                                      class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors whitespace-nowrap"
                                    >
                                      Delete
                                    </button>
                                  </div>
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

          <!-- Players Tab -->
          @if (activeTab() === 'players') {
            <div class="w-full">
              <div
                class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
              >
                <div class="mb-6 flex items-center justify-between">
                  <div>
                    <h2 class="text-xl font-bold text-white">Manage Players</h2>
                    <p class="text-slate-400 text-sm">
                      @if (playerFilterText()) {
                        Showing
                        {{
                          allPlayers().filter((p) =>
                            (p.email || p.cellphone || p.id)
                              .toLowerCase()
                              .includes(playerFilterText().toLowerCase())
                          ).length
                        }}
                      } @else {
                        {{ allPlayers().length }}
                      }
                      player(s)
                    </p>
                  </div>
                  <button
                    (click)="showCreatePlayerForm.set(true)"
                    class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Add Player</span>
                  </button>
                </div>

                <!-- Filter Input -->
                <div class="mb-6">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [value]="playerFilterText()"
                      (input)="playerFilterText.set($any($event.target).value)"
                      placeholder="Filter by email, phone, or player name..."
                      class="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                    />
                    <button
                      (click)="playerFilterText.set('')"
                      class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <!-- Players List -->
                @if (allPlayers().length === 0) {
                  <p class="text-slate-400 text-center py-12">No players yet</p>
                } @else {
                  @let filteredPlayers =
                    allPlayers().filter((p) =>
                      (p.email || p.cellphone || p.id)
                        .toLowerCase()
                        .includes(playerFilterText().toLowerCase())
                    );
                  @if (filteredPlayers.length === 0) {
                    <p class="text-slate-400 text-center py-12">
                      No players match your filter
                    </p>
                  } @else {
                    <div class="grid grid-cols-3 gap-4">
                      @for (player of filteredPlayers; track player.id) {
                        <div
                          class="bg-gradient-to-br from-blue-500/10 to-slate-600/10 border border-white/10 rounded-lg p-5 hover:border-cyan-400/50 transition-all"
                        >
                          <!-- Header with Name and Action Icons -->
                          <div
                            class="flex items-start justify-between gap-2 mb-3"
                          >
                            <div class="flex-1 min-w-0">
                              <h4 class="text-white font-bold text-lg truncate">
                                {{
                                  player.email ||
                                    player.cellphone ||
                                    'Player ' + player.id.slice(0, 8)
                                }}
                              </h4>
                              <p class="text-slate-400 text-sm truncate">
                                {{
                                  player.cellphone ||
                                    player.email ||
                                    'No contact info'
                                }}
                              </p>
                            </div>
                            <!-- Action Icons -->
                            <div class="flex gap-1 flex-shrink-0">
                              <button
                                (click)="
                                  editingPlayerId.set(player.id);
                                  playerForm.patchValue({
                                    email: player.email || '',
                                    cellphone: player.cellphone || '',
                                    password: '',
                                  });
                                  selectedPlayersStores.set(
                                    player.stores.map((s) => s.id)
                                  );
                                  showCreatePlayerForm.set(true)
                                "
                                title="Edit player"
                                class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors text-lg"
                              >
                                ✏️
                              </button>
                              <button
                                (click)="deletePlayer(player.id)"
                                title="Delete player"
                                class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors text-lg"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div class="mb-4 pb-3 border-b border-white/10">
                            <p
                              class="text-slate-400 text-xs font-semibold mb-2"
                            >
                              LINKED STORES ({{ player.stores.length }})
                            </p>
                            @if (player.stores.length === 0) {
                              <p class="text-slate-500 text-xs italic">
                                Not linked to any stores
                              </p>
                            } @else {
                              <div class="space-y-1">
                                @for (store of player.stores; track store.id) {
                                  <div
                                    class="flex items-center justify-between bg-cyan-500/20 border border-cyan-400/50 rounded px-2 py-1"
                                  >
                                    <span
                                      class="text-cyan-300 text-xs truncate"
                                      >{{ store.name }}</span
                                    >
                                    <button
                                      (click)="
                                        unlinkPlayerFromStore(
                                          player.id,
                                          store.id
                                        )
                                      "
                                      class="text-cyan-400 hover:text-red-400 text-xs cursor-pointer flex-shrink-0 ml-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                }
                              </div>
                            }
                          </div>

                          <!-- Link to Store -->
                          <div class="space-y-2 mb-3">
                            <select
                              (change)="
                                selectedStoreForLinking.set(
                                  $any($event.target).value
                                )
                              "
                              [value]="selectedStoreForLinking()"
                              class="w-full px-3 py-2 bg-blue-900 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-cyan-400"
                            >
                              <option value="">Link to store...</option>
                              @for (store of stores(); track store.id) {
                                @if (
                                  !player.stores.some((s) => s.id === store.id)
                                ) {
                                  <option [value]="store.id">
                                    {{ store.name }}
                                  </option>
                                }
                              }
                            </select>
                            <button
                              (click)="
                                linkPlayerToStore(
                                  player.id,
                                  selectedStoreForLinking()
                                )
                              "
                              [disabled]="
                                !selectedStoreForLinking() ||
                                isLoadingSettings()
                              "
                              class="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white text-xs rounded transition-colors font-semibold"
                            >
                              Link Store
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Create Store Modal -->
      @if (showCreateModal()) {
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div
              class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur"
            >
              <h2 class="text-2xl font-bold text-white">Create New Store</h2>
            </div>
            <form [formGroup]="form" (ngSubmit)="addStore()" class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Store Name</label
                  >
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="Main Gaming Hub"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Store Slug</label
                  >
                  <input
                    type="text"
                    formControlName="slug"
                    placeholder="main-gaming-hub"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Address</label
                  >
                  <input
                    type="text"
                    formControlName="address"
                    placeholder="123 Gaming St, City"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Tax Number (Optional)</label
                  >
                  <input
                    type="text"
                    formControlName="taxNumber"
                    placeholder="123456789"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Manager Name</label
                  >
                  <input
                    type="text"
                    formControlName="manager"
                    placeholder="John Manager"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Contact Person</label
                  >
                  <input
                    type="text"
                    formControlName="contactPerson"
                    placeholder="Jane Contact"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="!form.valid || isLoading()"
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {{ isLoading() ? 'Creating...' : 'Create Store' }}
                </button>
                <button
                  type="button"
                  (click)="showCreateModal.set(false); form.reset()"
                  class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Create Player Modal -->
      @if (showCreatePlayerForm()) {
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div
              class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur flex items-center justify-between"
            >
              <h2 class="text-2xl font-bold text-white">
                {{ editingPlayerId() ? 'Edit Player' : 'Create New Player' }}
              </h2>
              <button
                (click)="
                  showCreatePlayerForm.set(false);
                  playerForm.reset();
                  selectedPlayersStores.set([]);
                  editingPlayerId.set(null)
                "
                class="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form
              [formGroup]="playerForm"
              (ngSubmit)="editingPlayerId() ? updatePlayer() : createPlayer()"
              class="p-6 space-y-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Email (Optional)</label
                  >
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="player@example.com"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Phone (Optional)</label
                  >
                  <input
                    type="tel"
                    formControlName="cellphone"
                    placeholder="+1234567890"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label class="block text-slate-300 text-sm font-semibold mb-2"
                  >Password</label
                >
                <input
                  type="password"
                  formControlName="password"
                  placeholder="Min 8 characters"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label class="block text-slate-300 text-sm font-semibold mb-2"
                  >Select Stores</label
                >
                <div
                  class="max-h-48 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3"
                >
                  @for (store of stores(); track store.id) {
                    <div class="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        [id]="'create-store-' + store.id"
                        (change)="toggleStoreSelection($event, store.id)"
                        class="w-4 h-4 rounded cursor-pointer"
                      />
                      <label
                        [for]="'create-store-' + store.id"
                        class="text-slate-300 cursor-pointer flex-1"
                        >{{ store.name }}</label
                      >
                    </div>
                  }
                </div>
                @if (selectedPlayersStores().length === 0) {
                  <p class="text-slate-400 text-sm mt-2">
                    Select at least one store
                  </p>
                }
              </div>

              <div class="flex gap-3 pt-4 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="
                    !playerForm.valid ||
                    selectedPlayersStores().length === 0 ||
                    isLoadingSettings()
                  "
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {{
                    isLoadingSettings()
                      ? editingPlayerId()
                        ? 'Updating...'
                        : 'Creating...'
                      : editingPlayerId()
                        ? 'Update Player'
                        : 'Create Player'
                  }}
                </button>
                <button
                  type="button"
                  (click)="
                    showCreatePlayerForm.set(false);
                    playerForm.reset();
                    selectedPlayersStores.set([])
                  "
                  class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Store Modal -->
      @if (editingId()) {
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div
            class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div
              class="p-6 border-b border-white/10 sticky top-0 bg-slate-800/80 backdrop-blur"
            >
              <h2 class="text-2xl font-bold text-white">Edit Store</h2>
            </div>
            <form [formGroup]="editForm" (ngSubmit)="updateStore()" class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Store Name</label
                  >
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Store Slug</label
                  >
                  <input
                    type="text"
                    formControlName="slug"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Address</label
                  >
                  <input
                    type="text"
                    formControlName="address"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Tax Number (Optional)</label
                  >
                  <input
                    type="text"
                    formControlName="taxNumber"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Manager Name</label
                  >
                  <input
                    type="text"
                    formControlName="manager"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Contact Person</label
                  >
                  <input
                    type="text"
                    formControlName="contactPerson"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
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
  pricingForm: FormGroup;
  gameForm: FormGroup;
  playerForm: FormGroup;

  stores = signal<Store[]>([]);
  stations = signal<GamingStation[]>([]);
  pricingOptions = signal<PricingOption[]>([]);
  games = signal<Game[]>([]);
  allPlayers = signal<Player[]>([]);

  isLoading = signal(false);
  isLoadingSettings = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  showCreateModal = signal(false);

  activeTab = signal<TabType>('stores');
  selectedStoreForSettings = signal<string>('');
  selectedPlayersStores = signal<string[]>([]);
  showCreatePlayerForm = signal(false);
  selectedStoreForLinking = signal<string>('');
  playerFilterText = signal<string>('');
  editingPlayerId = signal<string | null>(null);
  editingGameId = signal<string | null>(null);
  gamePreviewUrl = signal<string | null>(null);

  filterText = signal('');
  viewMode = signal<'cards' | 'table'>('cards');
  currentPage = signal(0);
  itemsPerPage = 5;

  filteredStores = computed(() => {
    const text = this.filterText().toLowerCase();
    return this.stores().filter((s) => {
      const matchesText =
        !text ||
        s.name.toLowerCase().includes(text) ||
        (s.address?.toLowerCase().includes(text) ?? false);
      return matchesText;
    });
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredStores().length / this.itemsPerPage),
  );

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

    this.pricingForm = this.fb.group({
      durationMins: ['', [Validators.required, Validators.min(1)]],
      ratePerHour: ['', [Validators.required, Validators.min(0)]],
      label: [''],
    });

    this.gameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      thumbnail: [''],
    });

    this.playerForm = this.fb.group({
      email: ['', [Validators.email]],
      cellphone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadPlayers();
    // Load stations when activeTab changes to 'stations'
  }

  addStation(): void {
    if (!this.stationForm.valid || !this.selectedStoreForSettings()) return;
    this.isLoadingSettings.set(true);

    const { name } = this.stationForm.value;
    const storeId = this.selectedStoreForSettings();

    this.http
      .post(`${environment.apiUrl}/api/gaming-sessions/stations`, {
        storeId,
        name,
      })
      .subscribe({
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
    this.http
      .delete(`${environment.apiUrl}/api/gaming-sessions/stations/${stationId}`)
      .subscribe({
        next: () => {
          this.loadStations();
        },
        error: (err) => {
          console.error('Failed to delete station:', err);
        },
      });
  }

  addPricing(): void {
    if (!this.pricingForm.valid || !this.selectedStoreForSettings()) return;
    this.isLoadingSettings.set(true);

    const { durationMins, ratePerHour, label } = this.pricingForm.value;
    const storeId = this.selectedStoreForSettings();

    this.http
      .post(`${environment.apiUrl}/api/gaming-sessions/pricing`, {
        storeId,
        durationMins: parseInt(durationMins),
        ratePerHour: parseFloat(ratePerHour).toString(),
        label: label || undefined,
      })
      .subscribe({
        next: () => {
          this.pricingForm.reset();
          this.successMessage.set('Pricing package added successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadPricingOptions();
          this.isLoadingSettings.set(false);
        },
        error: (err) => {
          console.error('Failed to add pricing package:', err);
          this.errorMessage.set('Failed to add pricing package');
          this.isLoadingSettings.set(false);
        },
      });
  }

  deletePricingOption(pricingId: string): void {
    if (!confirm('Delete this pricing package? This cannot be undone.')) return;
    this.http
      .delete(`${environment.apiUrl}/api/gaming-sessions/pricing/${pricingId}`)
      .subscribe({
        next: () => {
          this.successMessage.set('Pricing package deleted successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadPricingOptions();
        },
        error: (err) => {
          console.error('Failed to delete pricing package:', err);
          this.errorMessage.set('Failed to delete pricing package');
        },
      });
  }

  loadGames(): void {
    if (!this.selectedStoreForSettings()) return;
    this.http
      .get<any>(`${environment.apiUrl}/api/gaming-sessions/games/${this.selectedStoreForSettings()}`)
      .subscribe({
        next: (response) => {
          this.games.set(response.data || []);
        },
        error: (err) => {
          console.error('Failed to load games:', err);
          this.errorMessage.set('Failed to load games');
        },
      });
  }

  private async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 500;
          const maxHeight = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  async onGameImageSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      this.errorMessage.set('Image must be smaller than 500KB');
      return;
    }

    try {
      const compressed = await this.compressImage(file);
      this.gameForm.patchValue({ thumbnail: compressed });
      this.gamePreviewUrl.set(compressed);
      this.errorMessage.set(null);
    } catch (err) {
      console.error('Failed to compress image:', err);
      this.errorMessage.set('Failed to process image');
    }
  }

  addGame(): void {
    if (!this.gameForm.valid || !this.selectedStoreForSettings()) {
      this.errorMessage.set('Please fill all required fields');
      return;
    }

    this.isLoadingSettings.set(true);
    const { name, thumbnail } = this.gameForm.value;
    const storeId = this.selectedStoreForSettings();

    this.http
      .post(`${environment.apiUrl}/api/gaming-sessions/games`, {
        storeId,
        name,
        thumbnail,
      })
      .subscribe({
        next: () => {
          this.gameForm.reset();
          this.gamePreviewUrl.set(null);
          this.successMessage.set('Game added successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadGames();
          this.isLoadingSettings.set(false);
        },
        error: (err) => {
          console.error('Failed to add game:', err);
          this.errorMessage.set('Failed to add game');
          this.isLoadingSettings.set(false);
        },
      });
  }

  updateGame(gameId: string): void {
    if (!this.gameForm.valid) {
      this.errorMessage.set('Please fill all required fields');
      return;
    }

    this.isLoadingSettings.set(true);
    const { name, thumbnail } = this.gameForm.value;

    this.http
      .put(`${environment.apiUrl}/api/gaming-sessions/games/${gameId}`, {
        name,
        thumbnail,
      })
      .subscribe({
        next: () => {
          this.gameForm.reset();
          this.gamePreviewUrl.set(null);
          this.editingGameId.set(null);
          this.successMessage.set('Game updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadGames();
          this.isLoadingSettings.set(false);
        },
        error: (err) => {
          console.error('Failed to update game:', err);
          this.errorMessage.set('Failed to update game');
          this.isLoadingSettings.set(false);
        },
      });
  }

  editGame(game: Game): void {
    this.editingGameId.set(game.id);
    this.gameForm.patchValue({
      name: game.name,
      thumbnail: game.thumbnail,
    });
    this.gamePreviewUrl.set(game.thumbnail || null);
  }

  cancelEditGame(): void {
    this.editingGameId.set(null);
    this.gameForm.reset();
    this.gamePreviewUrl.set(null);
  }

  deleteGame(gameId: string): void {
    if (!confirm('Delete this game? This cannot be undone.')) return;
    this.http
      .delete(`${environment.apiUrl}/api/gaming-sessions/games/${gameId}`)
      .subscribe({
        next: () => {
          this.successMessage.set('Game deleted successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadGames();
        },
        error: (err) => {
          console.error('Failed to delete game:', err);
          this.errorMessage.set('Failed to delete game');
        },
      });
  }

  createPlayer(): void {
    if (!this.playerForm.valid || this.selectedPlayersStores().length === 0) {
      this.errorMessage.set(
        'Please fill all required fields and select at least one store',
      );
      return;
    }

    const { email, cellphone, password } = this.playerForm.value;

    if (!email && !cellphone) {
      this.errorMessage.set('At least one of email or phone is required');
      return;
    }

    this.isLoadingSettings.set(true);
    this.errorMessage.set(null);

    const payload = {
      email: email || undefined,
      cellphone: cellphone || undefined,
      password,
      storeIds: this.selectedPlayersStores(),
    };

    this.http.post(`${environment.apiUrl}/api/players`, payload).subscribe({
      next: () => {
        this.playerForm.reset();
        this.selectedPlayersStores.set([]);
        this.successMessage.set('Player created successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadPlayers();
        this.isLoadingSettings.set(false);
      },
      error: (err) => {
        console.error('Failed to create player:', err);
        this.errorMessage.set(err.error?.error || 'Failed to create player');
        this.isLoadingSettings.set(false);
      },
    });
  }

  updatePlayer(): void {
    const playerId = this.editingPlayerId();
    if (!playerId || this.selectedPlayersStores().length === 0) {
      this.errorMessage.set('Please select at least one store');
      return;
    }

    const { email, cellphone } = this.playerForm.value;

    if (!email && !cellphone) {
      this.errorMessage.set('At least one of email or phone is required');
      return;
    }

    this.isLoadingSettings.set(true);
    this.errorMessage.set(null);

    const currentStores =
      this.allPlayers()
        .find((p) => p.id === playerId)
        ?.stores.map((s) => s.id) || [];
    const storesToAdd = this.selectedPlayersStores().filter(
      (id) => !currentStores.includes(id),
    );
    const storesToRemove = currentStores.filter(
      (id) => !this.selectedPlayersStores().includes(id),
    );

    let requestCount = 0;
    let completedCount = 0;

    // Add new stores
    if (storesToAdd.length > 0) {
      requestCount++;
      this.http
        .post(`${environment.apiUrl}/api/players/${playerId}/stores`, {
          storeIds: storesToAdd,
        })
        .subscribe({
          next: () => {
            completedCount++;
            if (completedCount === requestCount) {
              this.finishPlayerUpdate();
            }
          },
          error: (err) => {
            console.error('Failed to add stores:', err);
            this.errorMessage.set(
              err.error?.error || 'Failed to update stores',
            );
            this.isLoadingSettings.set(false);
          },
        });
    }

    // Remove old stores
    for (const storeId of storesToRemove) {
      requestCount++;
      this.http
        .delete(
          `${environment.apiUrl}/api/players/${playerId}/stores/${storeId}`,
        )
        .subscribe({
          next: () => {
            completedCount++;
            if (completedCount === requestCount) {
              this.finishPlayerUpdate();
            }
          },
          error: (err) => {
            console.error('Failed to remove store:', err);
            this.errorMessage.set(
              err.error?.error || 'Failed to update stores',
            );
            this.isLoadingSettings.set(false);
          },
        });
    }

    if (requestCount === 0) {
      this.finishPlayerUpdate();
    }
  }

  private finishPlayerUpdate(): void {
    this.playerForm.reset();
    this.selectedPlayersStores.set([]);
    this.editingPlayerId.set(null);
    this.showCreatePlayerForm.set(false);
    this.successMessage.set('Player updated successfully!');
    setTimeout(() => this.successMessage.set(null), 3000);
    this.loadPlayers();
    this.isLoadingSettings.set(false);
  }

  toggleStoreSelection(event: Event, storeId: string): void {
    const checkbox = event.target as HTMLInputElement;
    const current = this.selectedPlayersStores();

    if (checkbox.checked) {
      this.selectedPlayersStores.set([...current, storeId]);
    } else {
      this.selectedPlayersStores.set(current.filter((id) => id !== storeId));
    }
  }

  linkPlayerToStore(playerId: string, storeId: string): void {
    if (!playerId || !storeId) return;

    this.isLoadingSettings.set(true);

    this.http
      .post(`${environment.apiUrl}/api/players/${playerId}/stores`, {
        storeIds: [storeId],
      })
      .subscribe({
        next: () => {
          this.selectedStoreForLinking.set('');
          this.successMessage.set('Player linked to store successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadPlayers();
          this.isLoadingSettings.set(false);
        },
        error: (err) => {
          console.error('Failed to link player to store:', err);
          this.errorMessage.set(
            err.error?.error || 'Failed to link player to store',
          );
          this.isLoadingSettings.set(false);
        },
      });
  }

  unlinkPlayerFromStore(playerId: string, storeId: string): void {
    if (!confirm('Unlink this player from the store?')) return;

    this.http
      .delete(`${environment.apiUrl}/api/players/${playerId}/stores/${storeId}`)
      .subscribe({
        next: () => {
          this.successMessage.set('Player unlinked from store!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadPlayers();
        },
        error: (err) => {
          console.error('Failed to unlink player:', err);
          this.errorMessage.set(err.error?.error || 'Failed to unlink player');
        },
      });
  }

  deletePlayer(playerId: string): void {
    if (
      !confirm(
        'Are you sure you want to delete this player? This action cannot be undone.',
      )
    )
      return;

    this.http
      .delete(`${environment.apiUrl}/api/players/${playerId}`)
      .subscribe({
        next: () => {
          this.successMessage.set('Player deleted successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadPlayers();
        },
        error: (err) => {
          console.error('Failed to delete player:', err);
          this.errorMessage.set(err.error?.error || 'Failed to delete player');
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

    this.http
      .post<{
        data: Store;
      }>(`${environment.apiUrl}/api/stores`, this.form.value)
      .subscribe({
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

    this.http
      .put<{
        data: Store;
      }>(
        `${environment.apiUrl}/api/stores/${this.editingId()}`,
        this.editForm.value,
      )
      .subscribe({
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

    this.http.delete(`${environment.apiUrl}/api/stores/${id}`).subscribe({
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
    this.http
      .get<{ data: Store[] }>(`${environment.apiUrl}/api/stores`)
      .subscribe({
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

  loadStations(): void {
    if (!this.selectedStoreForSettings()) {
      this.stations.set([]);
      return;
    }
    this.http
      .get<{
        data: GamingStation[];
      }>(
        `${environment.apiUrl}/api/gaming-sessions/stations/${this.selectedStoreForSettings()}`,
      )
      .subscribe({
        next: (response) => {
          this.stations.set(response.data || []);
        },
        error: (err) => {
          console.error('Failed to load stations:', err);
          this.stations.set([]);
        },
      });
  }

  loadPricingOptions(): void {
    if (!this.selectedStoreForSettings()) {
      this.pricingOptions.set([]);
      return;
    }
    this.http
      .get<{
        data: PricingOption[];
      }>(
        `${environment.apiUrl}/api/gaming-sessions/pricing/${this.selectedStoreForSettings()}`,
      )
      .subscribe({
        next: (response) => {
          this.pricingOptions.set(response.data || []);
        },
        error: (err) => {
          console.error('Failed to load pricing options:', err);
          this.pricingOptions.set([]);
        },
      });
  }

  private loadPlayers(): void {
    this.http
      .get<{ data: Player[] }>(`${environment.apiUrl}/api/players`)
      .subscribe({
        next: (response) => {
          this.allPlayers.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load players:', err);
          this.errorMessage.set('Failed to load players');
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
