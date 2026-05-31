import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface WeeklyActivityData {
  day: string;
  count: number;
}

interface RevenueTrendData {
  date: string;
  revenue: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden"
    >
      <!-- Left Sidebar -->
      <aside
        class="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 flex flex-col flex-shrink-0 overflow-y-auto"
      >
        <!-- Logo -->
        <div class="mb-8">
          <img
            src="/playground-logo.png"
            alt="Playground Logo"
            class="w-full h-auto mb-4"
          />
          <div>
            <h2 class="text-white font-bold">Playground</h2>
            <p class="text-cyan-400 text-xs">Admin Panel</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-2">
          <div
            class="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 font-semibold flex items-center gap-3 cursor-pointer"
          >
            <span class="text-lg">📊</span>
            <span>Dashboard</span>
          </div>
          <div
            (click)="navigate('/cashiers')"
            class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
          >
            <span class="text-lg">👔</span>
            <span>Cashiers</span>
          </div>
          <div
            (click)="navigate('/stores')"
            class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
          >
            <span class="text-lg">🏪</span>
            <span>Stores</span>
          </div>
          <div
            (click)="navigate('/events')"
            class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
          >
            <span class="text-lg">🎮</span>
            <span>Events</span>
          </div>
          <div
            (click)="navigate('/leaderboard')"
            class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
          >
            <span class="text-lg">🏆</span>
            <span>Leaderboard</span>
          </div>
          <div
            (click)="navigate('/promotions')"
            class="px-4 py-3 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
          >
            <span class="text-lg">🎁</span>
            <span>Promotions</span>
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
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header -->
        <header
          class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h1 class="text-3xl font-bold text-white">Dashboard</h1>
            <p class="text-slate-400 text-sm">
              Welcome back, Admin — here's the system overview
            </p>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-green-400 text-sm font-semibold"
              >● System Online</span
            >
          </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 p-8 overflow-y-auto overflow-x-hidden w-full">
          <!-- Stats Grid -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <!-- Total Cashiers -->
            <div
              class="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 backdrop-blur-md rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/50 transition-all"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-cyan-300 text-sm font-semibold uppercase mb-1">
                    Total Cashiers
                  </p>
                  <p class="text-3xl font-bold text-white">
                    {{ totalCashiers() }}
                  </p>
                </div>
                <span class="text-3xl">👔</span>
              </div>
              <p class="text-cyan-400 text-xs font-semibold">
                Active staff members
              </p>
            </div>

            <!-- Total Stores -->
            <div
              class="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 hover:border-purple-400/50 transition-all"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p
                    class="text-purple-300 text-sm font-semibold uppercase mb-1"
                  >
                    Total Stores
                  </p>
                  <p class="text-3xl font-bold text-white">
                    {{ totalStores() }}
                  </p>
                </div>
                <span class="text-3xl">🏪</span>
              </div>
              <p class="text-purple-400 text-xs font-semibold">
                Across all regions
              </p>
            </div>

            <!-- Active Sessions -->
            <div
              class="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-md rounded-xl p-6 border border-green-400/20 hover:border-green-400/50 transition-all"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p
                    class="text-green-300 text-sm font-semibold uppercase mb-1"
                  >
                    Active Sessions
                  </p>
                  <p class="text-3xl font-bold text-white">{{ activeSessions() }}</p>
                </div>
                <span class="text-3xl">🔗</span>
              </div>
              <p class="text-green-400 text-xs font-semibold">
                Real-time monitoring
              </p>
            </div>

            <!-- Total Revenue -->
            <div
              class="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-md rounded-xl p-6 border border-orange-400/20 hover:border-orange-400/50 transition-all"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p
                    class="text-orange-300 text-sm font-semibold uppercase mb-1"
                  >
                    Total Revenue
                  </p>
                  <p class="text-3xl font-bold text-white">{{ formatCurrency(totalRevenue()) }}</p>
                </div>
                <span class="text-3xl">💰</span>
              </div>
              <p class="text-orange-400 text-xs font-semibold">
                All transactions
              </p>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Weekly Activity Chart -->
            <div
              class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <h3 class="text-lg font-bold text-white mb-4">Weekly Activity</h3>
              <div class="h-64 flex items-end gap-2 justify-around">
                @for (activity of weeklyActivity(); track activity.day) {
                  <div class="flex flex-col items-center flex-1">
                    <div
                      class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg"
                      [style.height.%]="getBarHeight(activity.count)"
                    ></div>
                    <p class="text-slate-400 text-xs mt-2">{{ activity.day.slice(0, 3) }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Revenue Trend -->
            <div
              class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <h3 class="text-lg font-bold text-white mb-4">Revenue Trend</h3>
              <div class="h-64 flex items-end gap-3 justify-around px-4">
                @if (revenueTrend().length > 0) {
                  <svg
                    [attr.viewBox]="getSVGViewBox()"
                    class="w-full"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      [attr.points]="getRevenuePoints()"
                      style="fill:none;stroke:url(#grad);stroke-width:3"
                    />
                    <defs>
                      <linearGradient
                        id="grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          style="stop-color:#a78bfa;stop-opacity:1"
                        />
                        <stop
                          offset="100%"
                          style="stop-color:#ec4899;stop-opacity:1"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                } @else {
                  <p class="text-slate-400 text-center w-full py-12">
                    No revenue data available
                  </p>
                }
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

  private apiUrl = environment.apiUrl;

  totalCashiers = signal(0);
  totalStores = signal(0);
  activeSessions = signal(0);
  weeklyActivity = signal<WeeklyActivityData[]>([]);
  revenueTrend = signal<RevenueTrendData[]>([]);
  totalRevenue = signal(0);

  maxWeeklyActivity = computed(() => {
    const activities = this.weeklyActivity();
    return activities.length > 0 ? Math.max(...activities.map(a => a.count)) : 1;
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadAnalytics();
  }

  private loadStats(): void {
    this.http.get<{ data: any[] }>(`${this.apiUrl}/api/cashiers`).subscribe({
      next: (response) => {
        this.totalCashiers.set(response.data.length);
      },
      error: (err) => {
        console.error('Failed to load cashiers count:', err);
      },
    });

    this.http.get<{ data: any[] }>(`${this.apiUrl}/api/stores`).subscribe({
      next: (response) => {
        this.totalStores.set(response.data.length);
      },
      error: (err) => {
        console.error('Failed to load stores count:', err);
      },
    });
  }

  private loadAnalytics(): void {
    this.http.get<{ data: WeeklyActivityData[] }>(`${this.apiUrl}/api/analytics/weekly-activity`).subscribe({
      next: (response) => {
        this.weeklyActivity.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load weekly activity:', err);
      },
    });

    this.http.get<{ data: RevenueTrendData[] }>(`${this.apiUrl}/api/analytics/revenue-trend`).subscribe({
      next: (response) => {
        this.revenueTrend.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load revenue trend:', err);
      },
    });

    this.http.get<{ data: number }>(`${this.apiUrl}/api/analytics/total-revenue`).subscribe({
      next: (response) => {
        this.totalRevenue.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load total revenue:', err);
      },
    });

    this.http.get<{ data: number }>(`${this.apiUrl}/api/analytics/active-sessions`).subscribe({
      next: (response) => {
        this.activeSessions.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load active sessions:', err);
      },
    });
  }

  getBarHeight(count: number): number {
    const max = this.maxWeeklyActivity();
    if (max === 0) return 10;
    return Math.max(10, (count / max) * 100);
  }

  getRevenuePoints(): string {
    const trend = this.revenueTrend();
    if (trend.length === 0) return '';

    const maxRevenue = Math.max(...trend.map(t => t.revenue), 1);
    const width = 300;
    const height = 150;
    const padding = 10;

    const points = trend.map((item, index) => {
      const x = padding + (index / (trend.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - (item.revenue / maxRevenue) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return points.join(' ');
  }

  getSVGViewBox(): string {
    return '0 0 300 150';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
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
