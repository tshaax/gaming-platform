import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@org/fe/auth';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-violet-900">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="/playground-logo.png" alt="Playground Logo" class="h-12 w-auto" />
            <h1 class="text-2xl font-bold text-white">Playground</h1>
          </div>
          <button
            (click)="logout()"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Hero Section -->
        <div class="mb-12">
          <div class="bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div>
              <h2 class="text-4xl font-bold text-white mb-2">Welcome, {{ userInfo()?.email || userInfo()?.cellphone || 'Gamer' }}!</h2>
              <p class="text-purple-200 text-lg">Select a store to access your gaming portal</p>
            </div>
          </div>
        </div>

        <!-- Stores Grid -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <div class="inline-block w-8 h-8 border-4 border-purple-300 border-t-white rounded-full animate-spin"></div>
          </div>
        } @else if (stores().length === 0) {
          <div class="text-center py-12">
            <p class="text-purple-200 text-lg">No stores available. Please contact support.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (store of stores(); track store.id) {
              <div
                (click)="selectStore(store)"
                class="bg-gradient-to-br from-blue-600/30 to-blue-700/30 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-blue-400/50 hover:from-blue-600/40 hover:to-blue-700/40 transition-all cursor-pointer"
              >
                <div class="text-4xl mb-3">🎮</div>
                <h3 class="text-xl font-bold text-white mb-2">{{ store.name }}</h3>
                <p class="text-blue-200 text-sm mb-4">{{ store.slug }}</p>
                <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Enter Store
                </button>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [],
})
export class LandingComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  userInfo = signal<{ email?: string | null; cellphone?: string | null; role?: string; userId?: string } | null>(null);
  stores = signal<Array<{ id: string; name: string; slug: string }>>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.userInfo.set({
      email: this.authService.user()?.email,
      cellphone: this.authService.user()?.cellphone,
      role: this.authService.role() || undefined,
      userId: this.authService.userId() || undefined,
    });

    this.fetchStores();
  }

  private fetchStores(): void {
    this.http.get<{ data: Array<{ id: string; name: string; slug: string }>; success: boolean }>(
      `${this.apiUrl}/api/auth/stores`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stores.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectStore(store: { id: string; name: string; slug: string }): void {
    console.log('Selected store:', store);
  }

  logout(): void {
    this.isLoading.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
