import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';

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
            <p class="text-cyan-400 text-xs">Admin Panel</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-2">
          <div class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3 cursor-pointer">
            <span class="text-lg">📊</span>
            <span>Dashboard</span>
          </div>
          <div (click)="navigate('/cashiers')" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">👔</span>
            <span>Cashiers</span>
          </div>
          <div (click)="navigate('/stores')" class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🏪</span>
            <span>Stores</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🎮</span>
            <span>Events</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🏆</span>
            <span>Leaderboard</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">🎁</span>
            <span>Promotions</span>
          </div>
          <div class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors">
            <span class="text-lg">📢</span>
            <span>Campaigns</span>
          </div>
        </nav>

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
            <h1 class="text-3xl font-bold text-white">Dashboard</h1>
            <p class="text-slate-400 text-sm">Welcome back, Admin — here's the system overview</p>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-green-400 text-sm font-semibold">● System Online</span>
          </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-auto">
          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Total Cashiers -->
            <div class="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 backdrop-blur-md rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/50 transition-all">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-cyan-300 text-sm font-semibold uppercase mb-1">Total Cashiers</p>
                  <p class="text-3xl font-bold text-white">{{ totalCashiers() }}</p>
                </div>
                <span class="text-3xl">👔</span>
              </div>
              <p class="text-cyan-400 text-xs font-semibold">Active staff members</p>
            </div>

            <!-- Total Stores -->
            <div class="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 hover:border-purple-400/50 transition-all">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-purple-300 text-sm font-semibold uppercase mb-1">Total Stores</p>
                  <p class="text-3xl font-bold text-white">{{ totalStores() }}</p>
                </div>
                <span class="text-3xl">🏪</span>
              </div>
              <p class="text-purple-400 text-xs font-semibold">Across all regions</p>
            </div>

            <!-- Active Sessions -->
            <div class="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-md rounded-xl p-6 border border-green-400/20 hover:border-green-400/50 transition-all">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-green-300 text-sm font-semibold uppercase mb-1">Active Sessions</p>
                  <p class="text-3xl font-bold text-white">0</p>
                </div>
                <span class="text-3xl">🔗</span>
              </div>
              <p class="text-green-400 text-xs font-semibold">Real-time monitoring</p>
            </div>

            <!-- Total Revenue -->
            <div class="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-md rounded-xl p-6 border border-orange-400/20 hover:border-orange-400/50 transition-all">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-orange-300 text-sm font-semibold uppercase mb-1">Total Revenue</p>
                  <p class="text-3xl font-bold text-white">$0</p>
                </div>
                <span class="text-3xl">💰</span>
              </div>
              <p class="text-orange-400 text-xs font-semibold">All transactions</p>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Weekly Activity Chart -->
            <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h3 class="text-lg font-bold text-white mb-4">Weekly Activity</h3>
              <div class="h-64 flex items-end gap-2 justify-around">
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 40%"></div>
                  <p class="text-slate-400 text-xs mt-2">Mon</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 60%"></div>
                  <p class="text-slate-400 text-xs mt-2">Tue</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 45%"></div>
                  <p class="text-slate-400 text-xs mt-2">Wed</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 75%"></div>
                  <p class="text-slate-400 text-xs mt-2">Thu</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 55%"></div>
                  <p class="text-slate-400 text-xs mt-2">Fri</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 85%"></div>
                  <p class="text-slate-400 text-xs mt-2">Sat</p>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <div class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg" style="height: 50%"></div>
                  <p class="text-slate-400 text-xs mt-2">Sun</p>
                </div>
              </div>
            </div>

            <!-- Revenue Trend -->
            <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h3 class="text-lg font-bold text-white mb-4">Revenue Trend</h3>
              <div class="h-64 flex items-end gap-3 justify-around px-4">
                <svg viewBox="0 0 300 150" class="w-full" preserveAspectRatio="none">
                  <polyline points="10,120 50,90 90,100 130,60 170,75 210,40 250,55 290,20"
                    style="fill:none;stroke:url(#grad);stroke-width:3" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
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

  totalCashiers = signal(0);
  totalStores = signal(0);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.http.get<{ data: any[] }>('http://localhost:3333/api/cashiers').subscribe({
      next: (response) => {
        this.totalCashiers.set(response.data.length);
      },
      error: (err) => {
        console.error('Failed to load cashiers count:', err);
      },
    });

    this.http.get<{ data: any[] }>('http://localhost:3333/api/stores').subscribe({
      next: (response) => {
        this.totalStores.set(response.data.length);
      },
      error: (err) => {
        console.error('Failed to load stores count:', err);
      },
    });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
