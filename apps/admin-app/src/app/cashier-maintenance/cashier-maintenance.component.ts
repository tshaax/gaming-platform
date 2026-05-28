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

interface Cashier {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  storeId: string;
  storeName?: string;
  passwordResetRequired?: boolean;
  createdAt?: string;
}

interface Store {
  id: string;
  name: string;
}

@Component({
  selector: 'app-cashier-maintenance',
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
              class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3"
            >
              <span class="text-lg">👔</span>
              <span>Cashiers</span>
            </div>
            <div
              (click)="goToStores()"
              class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
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
            <h1 class="text-3xl font-bold text-white">Cashier Management</h1>
            <p class="text-slate-400 text-sm">Add and manage cashier staff</p>
          </div>
          <button
            (click)="showCreateModal.set(true)"
            class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Cashier</span>
          </button>
        </header>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-y-auto overflow-x-hidden w-full">
          <!-- Cashiers List -->
          <div
            class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white">Cashiers List</h2>
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
                  placeholder="Filter by name or email..."
                  class="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                />
                <select
                  [value]="filterStore()"
                  (change)="filterStore.set($any($event.target).value)"
                  class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">All Stores</option>
                  @for (store of stores(); track store.id) {
                    <option [value]="store.id">{{ store.name }}</option>
                  }
                </select>
                <button
                  (click)="filterText.set(''); filterStore.set('')"
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
              {{ filteredCashiers().length }} cashiers
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
                        filteredCashiers().length === 0
                          ? 'No cashiers added yet'
                          : 'No results found'
                      }}
                    </p>
                  </div>
                } @else {
                  @for (cashier of currentPageItems(); track cashier.id) {
                    <div
                      class="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-400/50 transition-all"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <h3 class="text-white font-bold">
                            {{ cashier.firstName }} {{ cashier.lastName }}
                          </h3>
                          <p class="text-slate-400 text-sm">
                            {{ cashier.storeName || 'No store assigned' }}
                          </p>
                          <p class="text-slate-500 text-xs">
                            {{ cashier.email }}
                          </p>
                        </div>
                        <div class="flex gap-2">
                          <button
                            (click)="startEdit(cashier)"
                            class="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            (click)="deleteCashier(cashier.id)"
                            class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div
                        class="flex items-center gap-2 text-xs text-slate-400 flex-wrap"
                      >
                        <span>📞 {{ cashier.phone }}</span>
                        @if (cashier.passwordResetRequired) {
                          <span
                            class="px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-orange-400"
                            >Needs Password Reset</span
                          >
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <!-- Table View -->
            @if (viewMode() === 'table') {
              <div class="overflow-x-auto mb-6">
                @if (currentPageItems().length === 0) {
                  <div class="text-center py-12">
                    <p class="text-slate-400 text-lg">
                      {{
                        filteredCashiers().length === 0
                          ? 'No cashiers added yet'
                          : 'No results found'
                      }}
                    </p>
                  </div>
                } @else {
                  <table class="w-full text-sm">
                    <thead class="border-b border-white/10">
                      <tr class="text-slate-400">
                        <th class="text-left py-3 px-4 font-semibold">Name</th>
                        <th class="text-left py-3 px-4 font-semibold">Email</th>
                        <th class="text-left py-3 px-4 font-semibold">Phone</th>
                        <th class="text-left py-3 px-4 font-semibold">Store</th>
                        <th class="text-left py-3 px-4 font-semibold">
                          Status
                        </th>
                        <th class="text-left py-3 px-4 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (cashier of currentPageItems(); track cashier.id) {
                        <tr
                          class="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td class="py-3 px-4 text-white">
                            {{ cashier.firstName }} {{ cashier.lastName }}
                          </td>
                          <td class="py-3 px-4 text-slate-400">
                            {{ cashier.email }}
                          </td>
                          <td class="py-3 px-4 text-slate-400">
                            {{ cashier.phone }}
                          </td>
                          <td class="py-3 px-4 text-slate-400">
                            {{ cashier.storeName || '-' }}
                          </td>
                          <td class="py-3 px-4">
                            @if (cashier.passwordResetRequired) {
                              <span
                                class="px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-orange-400 text-xs"
                                >Reset Required</span
                              >
                            } @else {
                              <span
                                class="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-xs"
                                >Active</span
                              >
                            }
                          </td>
                          <td class="py-3 px-4 flex gap-2">
                            <button
                              (click)="startEdit(cashier)"
                              class="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-400 text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              (click)="deleteCashier(cashier.id)"
                              class="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded text-red-400 text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
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
        </div>
      </main>

      <!-- Create Cashier Modal -->
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
              <h2 class="text-2xl font-bold text-white">Add New Cashier</h2>
            </div>
            <form [formGroup]="form" (ngSubmit)="addCashier()" class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <!-- First Name -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >First Name</label
                  >
                  <input
                    type="text"
                    formControlName="firstName"
                    placeholder="John"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    form.get('firstName')?.invalid &&
                    form.get('firstName')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 2 characters required
                    </p>
                  }
                </div>

                <!-- Last Name -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Last Name</label
                  >
                  <input
                    type="text"
                    formControlName="lastName"
                    placeholder="Doe"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    form.get('lastName')?.invalid &&
                    form.get('lastName')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 2 characters required
                    </p>
                  }
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Email</label
                  >
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="john@example.com"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    form.get('email')?.invalid && form.get('email')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Valid email required
                    </p>
                  }
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Phone</label
                  >
                  <input
                    type="tel"
                    formControlName="phone"
                    placeholder="+1 (555) 000-0000"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    form.get('phone')?.invalid && form.get('phone')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 7 characters required
                    </p>
                  }
                </div>

                <!-- Store -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Assign to Store</label
                  >
                  <select
                    formControlName="storeId"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="" class="bg-slate-900">
                      Select a store...
                    </option>
                    @for (store of stores(); track store.id) {
                      <option [value]="store.id" class="bg-slate-900">
                        {{ store.name }}
                      </option>
                    }
                  </select>
                  @if (
                    form.get('storeId')?.invalid && form.get('storeId')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Store selection required
                    </p>
                  }
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Initial Password</label
                  >
                  <input
                    type="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <p class="text-slate-400 text-xs mt-1">Min 8 characters</p>
                  @if (
                    form.get('password')?.invalid &&
                    form.get('password')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 8 characters required
                    </p>
                  }
                </div>
              </div>

              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="!form.valid || isLoading()"
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {{ isLoading() ? 'Adding...' : 'Add Cashier' }}
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

      <!-- Edit Cashier Modal -->
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
              <h2 class="text-2xl font-bold text-white">Edit Cashier</h2>
            </div>
            <form
              [formGroup]="editForm"
              (ngSubmit)="updateCashier()"
              class="p-6"
            >
              <div class="grid grid-cols-2 gap-6">
                <!-- First Name -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >First Name</label
                  >
                  <input
                    type="text"
                    formControlName="firstName"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    editForm.get('firstName')?.invalid &&
                    editForm.get('firstName')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 2 characters required
                    </p>
                  }
                </div>

                <!-- Last Name -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Last Name</label
                  >
                  <input
                    type="text"
                    formControlName="lastName"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    editForm.get('lastName')?.invalid &&
                    editForm.get('lastName')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 2 characters required
                    </p>
                  }
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Email</label
                  >
                  <input
                    type="email"
                    formControlName="email"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    editForm.get('email')?.invalid &&
                    editForm.get('email')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Valid email required
                    </p>
                  }
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Phone</label
                  >
                  <input
                    type="tel"
                    formControlName="phone"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  @if (
                    editForm.get('phone')?.invalid &&
                    editForm.get('phone')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Min 7 characters required
                    </p>
                  }
                </div>

                <!-- Store -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Assign to Store</label
                  >
                  <select
                    formControlName="storeId"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="" class="bg-slate-900">
                      Select a store...
                    </option>
                    @for (store of stores(); track store.id) {
                      <option [value]="store.id" class="bg-slate-900">
                        {{ store.name }}
                      </option>
                    }
                  </select>
                  @if (
                    editForm.get('storeId')?.invalid &&
                    editForm.get('storeId')?.touched
                  ) {
                    <p class="text-red-400 text-xs mt-1">
                      Store selection required
                    </p>
                  }
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-slate-300 text-sm font-semibold mb-2"
                    >Password (Optional)</label
                  >
                  <input
                    type="password"
                    formControlName="password"
                    placeholder="Leave empty to keep current"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  />
                  <p class="text-slate-400 text-xs mt-1">
                    Min 8 characters if changing
                  </p>
                </div>
              </div>

              <div class="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  type="submit"
                  [disabled]="!editForm.valid || isLoading()"
                  class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
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
export class CashierMaintenanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = environment.apiUrl;

  form: FormGroup;
  editForm: FormGroup;
  cashiers = signal<Cashier[]>([]);
  stores = signal<Store[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  editingId = signal<string | null>(null);
  showCreateModal = signal(false);

  filterText = signal('');
  filterStore = signal('');
  viewMode = signal<'cards' | 'table'>('cards');
  currentPage = signal(0);
  itemsPerPage = 5;

  filteredCashiers = computed(() => {
    const text = this.filterText().toLowerCase();
    const store = this.filterStore();
    return this.cashiers().filter((c) => {
      const matchesText =
        !text ||
        c.firstName.toLowerCase().includes(text) ||
        c.lastName.toLowerCase().includes(text) ||
        c.email.toLowerCase().includes(text);
      const matchesStore = !store || c.storeId === store;
      return matchesText && matchesStore;
    });
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredCashiers().length / this.itemsPerPage),
  );

  currentPageItems = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCashiers().slice(start, end);
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
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      storeId: ['', [Validators.required]],
    });

    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      password: [''],
      storeId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadCashiers();
  }

  addCashier(): void {
    if (!this.form.valid) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http
      .post<{ data: Cashier }>(`${this.apiUrl}/api/cashiers`, this.form.value)
      .subscribe({
        next: () => {
          this.form.reset();
          this.showCreateModal.set(false);
          this.successMessage.set('Cashier added successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.loadCashiers();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to add cashier:', err);
          this.errorMessage.set(err.error?.error || 'Failed to add cashier');
          this.isLoading.set(false);
        },
      });
  }

  startEdit(cashier: Cashier): void {
    this.editingId.set(cashier.id);
    this.editForm.patchValue({
      firstName: cashier.firstName,
      lastName: cashier.lastName,
      email: cashier.email,
      phone: cashier.phone,
      storeId: cashier.storeId,
      password: '',
    });
  }

  updateCashier(): void {
    if (!this.editForm.valid || !this.editingId()) {
      this.errorMessage.set('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const data = { ...this.editForm.value };
    if (!data.password) delete data.password;

    this.http
      .put<{
        data: Cashier;
      }>(`${this.apiUrl}/api/cashiers/${this.editingId()}`, data)
      .subscribe({
        next: () => {
          this.successMessage.set('Cashier updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.editingId.set(null);
          this.loadCashiers();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to update cashier:', err);
          this.errorMessage.set(err.error?.error || 'Failed to update cashier');
          this.isLoading.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  deleteCashier(id: string): void {
    if (!confirm('Are you sure you want to delete this cashier?')) return;

    this.http.delete(`${this.apiUrl}/api/cashiers/${id}`).subscribe({
      next: () => {
        this.successMessage.set('Cashier deleted successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadCashiers();
      },
      error: (err) => {
        console.error('Failed to delete cashier:', err);
        this.errorMessage.set('Failed to delete cashier');
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

  private loadCashiers(): void {
    this.http
      .get<{ data: Cashier[] }>(`${this.apiUrl}/api/cashiers`)
      .subscribe({
        next: (response) => {
          const cashiers = response.data.map((c) => {
            const store = this.stores().find((s) => s.id === c.storeId);
            return { ...c, storeName: store?.name };
          });
          this.cashiers.set(cashiers);
          this.currentPage.set(0);
        },
        error: (err) => {
          console.error('Failed to load cashiers:', err);
          this.errorMessage.set('Failed to load cashiers');
        },
      });
  }

  private loadStores(): void {
    this.http.get<{ data: Store[] }>(`${this.apiUrl}/api/stores`).subscribe({
      next: (response) => {
        this.stores.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToStores(): void {
    this.router.navigate(['/stores']);
  }
}
