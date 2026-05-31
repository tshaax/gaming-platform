import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

interface Promotion {
  id: string;
  storeId: string | null;
  title: string;
  type: string;
  promoCode: string;
  discountValue: number | null;
  status: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  maxUsage: number | null;
  currentUsage: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  id: string;
  name: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-950 text-white p-8">
      <!-- Header with sidebar -->
      <div class="flex gap-8">
        <!-- Sidebar -->
        <div class="w-64">
          <button
            (click)="navigateToDashboard()"
            class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition w-full"
          >
            <span class="text-xl">←</span>
            <span>Back to Dashboard</span>
          </button>

          <nav class="mt-8 space-y-2">
            <div
              class="px-4 py-3 bg-white/5 border-l-2 border-cyan-400 text-white flex items-center gap-3"
            >
              <span class="text-lg">🎁</span>
              <span>Promotions</span>
            </div>
          </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Header -->
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="text-4xl font-bold mb-2">Promotions</h1>
              <p class="text-cyan-400">
                {{ totalPromotionsCount() }} promotions
              </p>
            </div>
            <button
              (click)="openCreateModal()"
              class="px-6 py-2 bg-cyan-400 text-black rounded-lg font-bold hover:bg-cyan-300 transition flex items-center gap-2"
            >
              <span>+</span>
              <span>New Promotion</span>
            </button>
          </div>

          <!-- Filters -->
          <div class="mb-8 flex gap-6 items-center">
            <!-- Store Selector -->
            <div class="w-48">
              <label class="block text-sm text-gray-400 mb-2">Store</label>
              <select
                [(ngModel)]="selectedStore"
                (change)="onStoreChange()"
                class="w-full px-3 py-2 bg-black/80 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
              >
                <option value="">All Stores</option>
                <option
                  *ngFor="let store of stores()"
                  [value]="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Status Filter Tabs -->
          <div class="flex gap-3 mb-8">
            <button
              *ngFor="let status of statusFilters()"
              (click)="selectStatus(status)"
              [class.bg-cyan-400]="selectedStatus() === status"
              [class.text-black]="selectedStatus() === status"
              [class.text-gray-400]="selectedStatus() !== status"
              [class.hover:text-white]="selectedStatus() !== status"
              class="px-4 py-2 rounded-full font-semibold transition capitalize"
              [style]="
                selectedStatus() !== status
                  ? 'background-color: rgba(255,255,255,0.05)'
                  : ''
              "
            >
              {{ status }}
            </button>
          </div>

          <!-- Promotions Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              *ngFor="let promo of filteredPromotions()"
              class="bg-gray-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition"
            >
              <!-- Status Badge -->
              <div class="flex items-start justify-between mb-4">
                <span
                  [ngClass]="getStatusColor(promo.status)"
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {{ promo.status | titlecase }}
                </span>
                <div class="flex gap-2">
                  <button
                    (click)="openEditModal(promo)"
                    class="p-2 text-blue-400 hover:text-blue-300 transition"
                    title="Edit promotion"
                  >
                    ✏️
                  </button>
                  <button
                    (click)="deletePromotion(promo.id)"
                    class="p-2 text-red-400 hover:text-red-300 transition"
                    title="Delete promotion"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Title and Type -->
              <h3 class="text-xl font-bold mb-2">{{ promo.title }}</h3>
              <p class="text-gray-400 text-sm mb-4">{{ promo.type | titlecase }}</p>

              <!-- Description -->
              <p class="text-gray-300 text-sm mb-4">{{ promo.description }}</p>

              <!-- Promo Details -->
              <div class="space-y-2 mb-4 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-purple-400">🏷️</span>
                  <span class="text-cyan-400 font-semibold">{{ promo.promoCode }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-green-400">💰</span>
                  <span *ngIf="promo.discountValue"
                    >{{ promo.discountValue }}% off</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span>👥</span>
                  <span class="text-gray-400">{{ promo.targetAudience | titlecase }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>⏰</span>
                  <span class="text-gray-400">Ends {{ promo.endDate | date: 'M/d/yyyy' }}</span>
                </div>
              </div>

              <!-- Usage Progress Bar -->
              <div *ngIf="promo.maxUsage" class="mb-2">
                <div class="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Usage</span>
                  <span>{{ promo.currentUsage }}/{{ promo.maxUsage }}</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-2">
                  <div
                    class="bg-cyan-400 h-2 rounded-full transition"
                    [style]="
                      'width: ' +
                      ((promo.currentUsage / promo.maxUsage) * 100 | number: '1.0-0') +
                      '%'
                    "
                  ></div>
                </div>
              </div>
            </div>

            <div *ngIf="filteredPromotions().length === 0" class="col-span-full text-gray-500 py-12 text-center">
              No promotions found for the selected filters
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div
        *ngIf="showModal()"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <div class="bg-gray-900 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">
              {{ editingPromoId() ? 'Edit Promotion' : 'New Promotion' }}
            </h2>
            <button
              (click)="closeModal()"
              class="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <form [formGroup]="promotionForm" class="space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm text-gray-400 mb-2">Title</label>
              <input
                type="text"
                formControlName="title"
                class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                placeholder="e.g., Spring Season Pass 50% Off"
              />
            </div>

            <!-- Type and Status -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Type</label>
                <select
                  formControlName="type"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                >
                  <option value="discount">Discount</option>
                  <option value="bonus_points">Bonus Points</option>
                  <option value="free_item">Free Item</option>
                  <option value="cashback">Cashback</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  formControlName="status"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <!-- Promo Code and Discount Value -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Promo Code</label>
                <input
                  type="text"
                  formControlName="promoCode"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none uppercase"
                  placeholder="e.g., GAME20"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">Discount Value (%)</label>
                <input
                  type="number"
                  formControlName="discountValue"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Start Date and End Date -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  formControlName="startDate"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  formControlName="endDate"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                />
              </div>
            </div>

            <!-- Target Audience and Max Usage -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Target Audience</label>
                <select
                  formControlName="targetAudience"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                >
                  <option value="all_players">All Players</option>
                  <option value="new_players">New Players</option>
                  <option value="vip_players">VIP Players</option>
                  <option value="inactive_players">Inactive Players</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">Max Usage</label>
                <input
                  type="number"
                  formControlName="maxUsage"
                  class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                  placeholder="Unlimited if empty"
                />
              </div>
            </div>

            <!-- Store Selection -->
            <div>
              <label class="block text-sm text-gray-400 mb-2">Store</label>
              <select
                formControlName="storeId"
                class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
              >
                <option value="">All Stores</option>
                <option
                  *ngFor="let store of stores()"
                  [value]="store.id"
                >
                  {{ store.name }}
                </option>
              </select>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                formControlName="description"
                class="w-full px-4 py-2 bg-black/50 border border-white/20 rounded text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none"
                rows="3"
                placeholder="Enter promotion description"
              ></textarea>
            </div>

            <!-- Error Message -->
            <div
              *ngIf="errorMessage()"
              class="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm"
            >
              {{ errorMessage() }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 pt-4">
              <button
                type="button"
                (click)="closeModal()"
                class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="savePromotion()"
                [disabled]="isLoading()"
                class="px-6 py-2 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition flex-1 disabled:opacity-50"
              >
                {{ editingPromoId() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PromotionsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Signals
  stores = signal<Store[]>([]);
  promotions = signal<Promotion[]>([]);
  selectedStore = '';
  selectedStatus = signal('all');
  showModal = signal(false);
  editingPromoId = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  promotionForm: FormGroup;

  // Computed
  statusFilters = computed(() => ['all', 'active', 'scheduled', 'paused', 'expired']);

  filteredPromotions = computed(() => {
    let result = this.promotions();

    if (this.selectedStatus() !== 'all') {
      result = result.filter((p) => p.status === this.selectedStatus());
    }

    if (this.selectedStore && this.selectedStore !== 'all') {
      result = result.filter((p) => p.storeId === this.selectedStore);
    }

    return result;
  });

  totalPromotionsCount = computed(() => this.promotions().length);

  constructor() {
    this.promotionForm = this.fb.group({
      title: ['', Validators.required],
      type: ['discount', Validators.required],
      status: ['scheduled', Validators.required],
      promoCode: ['', Validators.required],
      discountValue: [0],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      targetAudience: ['all_players'],
      maxUsage: [null],
      storeId: [''],
      description: [''],
    });
  }

  ngOnInit() {
    this.loadStores();
    this.loadPromotions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStores() {
    this.http
      .get<any>(`${environment.apiUrl}/api/stores`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stores.set(response.data || []);
        },
        error: (err) => console.error('Error loading stores:', err),
      });
  }

  private loadPromotions() {
    this.isLoading.set(true);
    const storeId = this.selectedStore || 'all';
    const status = this.selectedStatus() === 'all' ? undefined : this.selectedStatus();

    let url = `${environment.apiUrl}/api/promotions?storeId=${storeId}`;
    if (status) {
      url += `&status=${status}`;
    }

    this.http
      .get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.promotions.set(response.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading promotions:', err);
          this.isLoading.set(false);
        },
      });
  }

  onStoreChange() {
    this.loadPromotions();
  }

  selectStatus(status: string) {
    this.selectedStatus.set(status);
  }

  openCreateModal() {
    this.editingPromoId.set(null);
    this.promotionForm.reset({
      type: 'discount',
      status: 'scheduled',
      targetAudience: 'all_players',
    });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  openEditModal(promo: Promotion) {
    this.editingPromoId.set(promo.id);
    this.promotionForm.patchValue({
      title: promo.title,
      type: promo.type,
      status: promo.status,
      promoCode: promo.promoCode,
      discountValue: promo.discountValue,
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      targetAudience: promo.targetAudience,
      maxUsage: promo.maxUsage,
      storeId: promo.storeId || '',
      description: promo.description,
    });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingPromoId.set(null);
  }

  savePromotion() {
    if (!this.promotionForm.valid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    const formValue = this.promotionForm.value;
    const payload = {
      title: formValue.title,
      type: formValue.type,
      status: formValue.status,
      promoCode: formValue.promoCode.toUpperCase(),
      discountValue: formValue.discountValue ? parseFloat(formValue.discountValue) : null,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      targetAudience: formValue.targetAudience,
      maxUsage: formValue.maxUsage ? parseInt(formValue.maxUsage) : null,
      storeId: formValue.storeId || undefined,
      description: formValue.description,
    };

    if (this.editingPromoId()) {
      this.http
        .put<any>(`${environment.apiUrl}/api/promotions/${this.editingPromoId()}`, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadPromotions();
          },
          error: (err) => {
            this.errorMessage.set(err.error?.error || 'Failed to update promotion');
          },
        });
    } else {
      this.http
        .post<any>(`${environment.apiUrl}/api/promotions`, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadPromotions();
          },
          error: (err) => {
            this.errorMessage.set(err.error?.error || 'Failed to create promotion');
          },
        });
    }
  }

  deletePromotion(promoId: string) {
    if (confirm('Are you sure you want to delete this promotion?')) {
      this.http
        .delete<any>(`${environment.apiUrl}/api/promotions/${promoId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadPromotions();
          },
          error: (err) => console.error('Error deleting promotion:', err),
        });
    }
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-300',
      scheduled: 'bg-blue-500/20 text-blue-300',
      paused: 'bg-yellow-500/20 text-yellow-300',
      expired: 'bg-gray-500/20 text-gray-300',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  }
}
