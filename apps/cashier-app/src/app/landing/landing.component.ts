import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';

interface Store {
  id: string;
  name: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <!-- Left Sidebar -->
      <aside class="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col">
        <!-- Logo -->
        <div class="mb-8">
          <img src="/playground-logo.png" alt="Playground Logo" class="w-full h-auto mb-4" />
          <div>
            <h2 class="text-white font-bold">Playground</h2>
            <p class="text-cyan-400 text-xs">Cashier</p>
          </div>
        </div>

        <!-- Store Info -->
        <div class="mb-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
          <p class="text-slate-400 text-xs font-semibold uppercase">Store</p>
          <p class="text-white font-bold text-sm">{{ storeName() || 'Loading...' }}</p>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-2">
          <div class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3 cursor-pointer">
            <span class="text-lg">🛒</span>
            <span>POS</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🔗</span>
            <span>Live Sessions</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">📊</span>
            <span>Reports</span>
          </div>
        </nav>

        <!-- Admin Panel Section -->
        <div class="border-t border-white/10 pt-4 mb-4">
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🔧</span>
            <span>Admin Panel</span>
          </div>
        </div>

        <!-- Logout Button -->
        <button
          (click)="logout()"
          class="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 font-semibold flex items-center gap-3 transition-colors"
        >
          <span class="text-lg">🚪</span>
          <span>Logout</span>
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
            <div class="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 backdrop-blur-md rounded-xl p-8 border border-cyan-400/30 hover:border-cyan-400/70 transition-all cursor-pointer group">
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

          <!-- Player Activity Chart -->
          <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10 flex-1">
            <h3 class="text-lg font-bold text-white mb-4">Player Activity</h3>
            <div class="h-64 flex items-end gap-3 justify-around px-4">
              <svg viewBox="0 0 300 150" class="w-full" preserveAspectRatio="none">
                <polyline points="10,120 50,85 90,95 130,55 170,70 210,35 250,50 290,15"
                  style="fill:none;stroke:url(#grad);stroke-width:3" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class LandingComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  storeName = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStoreName();
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

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
