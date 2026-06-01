import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@org/fe/auth';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface Metric {
  label: string;
  value: number;
  icon: string;
  color: string;
  format: 'currency' | 'number';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            (click)="router.navigate([''])"
            class="text-white hover:text-cyan-400 transition-colors p-2"
          >
            <span class="text-2xl">←</span>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-white">Reports</h1>
            <p class="text-slate-400 text-sm">Gaming platform analytics and insights</p>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-8 overflow-auto">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (metric of metrics(); track metric.label) {
            <div [ngClass]="{
              'from-cyan-600/20 to-cyan-700/20 border-cyan-400/20': metric.color === 'cyan',
              'from-green-600/20 to-green-700/20 border-green-400/20': metric.color === 'green',
              'from-purple-600/20 to-purple-700/20 border-purple-400/20': metric.color === 'purple',
              'from-orange-600/20 to-orange-700/20 border-orange-400/20': metric.color === 'orange'
            }" class="bg-gradient-to-br backdrop-blur-md rounded-xl p-6 border hover:border-white/50 transition-all">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p [ngClass]="{
                    'text-cyan-300': metric.color === 'cyan',
                    'text-green-300': metric.color === 'green',
                    'text-purple-300': metric.color === 'purple',
                    'text-orange-300': metric.color === 'orange'
                  }" class="text-sm font-semibold uppercase mb-1">
                    {{ metric.label }}
                  </p>
                  <p class="text-3xl font-bold text-white">
                    @if (metric.format === 'currency') {
                      {{ formatCurrency(metric.value) }}
                    } @else {
                      {{ metric.value }}
                    }
                  </p>
                </div>
                <span class="text-3xl">{{ metric.icon }}</span>
              </div>
              <p [ngClass]="{
                'text-cyan-400': metric.color === 'cyan',
                'text-green-400': metric.color === 'green',
                'text-purple-400': metric.color === 'purple',
                'text-orange-400': metric.color === 'orange'
              }" class="text-xs font-semibold">
                {{ getMetricDescription(metric.label) }}
              </p>
            </div>
          }
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Daily Sessions Chart -->
          <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 class="text-lg font-bold text-white mb-4">Daily Sessions (Last 7 Days)</h3>
            <div class="h-64 flex items-end gap-2 justify-around">
              @for (day of dailySessions(); track day.day) {
                <div class="flex flex-col items-center flex-1">
                  <div
                    class="bg-gradient-to-t from-cyan-500 to-cyan-400 w-full rounded-t-lg"
                    [style.height.%]="getBarHeight(day.count, maxDailyCount())"
                  ></div>
                  <p class="text-slate-400 text-xs mt-2">{{ day.day.slice(0, 3) }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Revenue by Station Chart -->
          <div class="bg-gradient-to-br from-blue-600/10 to-slate-600/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 class="text-lg font-bold text-white mb-4">Revenue by Station</h3>
            <div class="h-64 flex items-end gap-2 justify-around px-4">
              @for (station of revenueByStation(); track station.station) {
                <div class="flex flex-col items-center flex-1">
                  <div
                    class="bg-gradient-to-t from-purple-500 to-purple-400 w-full rounded-t-lg"
                    [style.height.%]="getBarHeight(station.revenue, maxRevenue())"
                  ></div>
                  <p class="text-slate-400 text-xs mt-2">{{ station.station }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class ReportsComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  public router = inject(Router);
  private apiUrl = environment.apiUrl;

  metrics = signal<Metric[]>([
    { label: 'Total Revenue', value: 49.25, icon: '$', color: 'cyan', format: 'currency' },
    { label: 'Completed Sessions', value: 16, icon: '✓', color: 'green', format: 'number' },
    { label: 'Active Sessions', value: 1, icon: '●', color: 'purple', format: 'number' },
    { label: 'Total Hours', value: 10.5, icon: '⏱️', color: 'orange', format: 'number' },
  ]);

  dailySessions = signal<{ day: string; count: number }[]>([
    { day: 'Monday', count: 3 },
    { day: 'Tuesday', count: 2 },
    { day: 'Wednesday', count: 5 },
    { day: 'Thursday', count: 2 },
    { day: 'Friday', count: 2 },
    { day: 'Saturday', count: 0 },
    { day: 'Sunday', count: 0 },
  ]);

  revenueByStation = signal<{ station: string; revenue: number }[]>([
    { station: 'S2', revenue: 20 },
    { station: 'S4', revenue: 15 },
    { station: 'S3', revenue: 10 },
    { station: 'S5', revenue: 2 },
    { station: 'S1', revenue: 1.5 },
    { station: 'Tournament', revenue: 0.75 },
  ]);

  maxDailyCount = signal(5);
  maxRevenue = signal(20);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.loadMetrics();
    this.loadDailySessions();
    this.loadRevenueByStation();
  }

  private loadMetrics(): void {
    this.http.get<{ data: { totalRevenue: number; completedSessions: number; activeSessions: number; totalHours: number } }>(`${this.apiUrl}/api/analytics/metrics`).subscribe({
      next: (response) => {
        const data = response.data;
        this.metrics.set([
          { label: 'Total Revenue', value: data.totalRevenue, icon: '$', color: 'cyan', format: 'currency' },
          { label: 'Completed Sessions', value: data.completedSessions, icon: '✓', color: 'green', format: 'number' },
          { label: 'Active Sessions', value: data.activeSessions, icon: '●', color: 'purple', format: 'number' },
          { label: 'Total Hours', value: data.totalHours, icon: '⏱️', color: 'orange', format: 'number' },
        ]);
      },
      error: (err) => {
        console.error('Failed to load metrics:', err);
      },
    });
  }

  private loadDailySessions(): void {
    this.http.get<{ data: { day: string; count: number }[] }>(`${this.apiUrl}/api/analytics/weekly-activity`).subscribe({
      next: (response) => {
        const data = response.data;
        this.dailySessions.set(data);
        const counts = data.map(d => d.count);
        this.maxDailyCount.set(Math.max(...counts, 5));
      },
      error: (err) => {
        console.error('Failed to load daily sessions:', err);
      },
    });
  }

  private loadRevenueByStation(): void {
    this.http.get<{ data: { station: string; revenue: number }[] }>(`${this.apiUrl}/api/analytics/revenue-by-station`).subscribe({
      next: (response) => {
        const data = response.data;
        this.revenueByStation.set(data);
        const revenues = data.map(s => s.revenue);
        this.maxRevenue.set(Math.max(...revenues, 20));
      },
      error: (err) => {
        console.error('Failed to load revenue by station:', err);
      },
    });
  }

  getBarHeight(count: number, max: number): number {
    if (max === 0) return 10;
    return Math.max(10, (count / max) * 100);
  }

  getMetricDescription(label: string): string {
    const descriptions: Record<string, string> = {
      'Total Revenue': 'All transactions',
      'Completed Sessions': 'Finished sessions',
      'Active Sessions': 'Real-time monitoring',
      'Total Hours': 'Gaming time',
    };
    return descriptions[label] || '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
