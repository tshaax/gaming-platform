import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { gamingSessions } from '@org/api/db';
import { sql, eq } from 'drizzle-orm';

interface WeeklyActivityData {
  day: string;
  count: number;
}

interface RevenueTrendData {
  date: string;
  revenue: number;
}

export class AnalyticsService {
  private db: ReturnType<typeof drizzle>;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async getWeeklyActivity(): Promise<WeeklyActivityData[]> {
    const query = sql`
      SELECT
        to_char(started_at, 'Day') as day,
        EXTRACT(DOW FROM started_at) as dow,
        COUNT(*) as count
      FROM gaming_sessions
      WHERE started_at >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM started_at), to_char(started_at, 'Day')
      ORDER BY dow
    `;

    const result = await this.db.execute(query);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activityMap = new Map<number, number>();

    // Initialize all days with 0
    for (let i = 0; i < 7; i++) {
      activityMap.set(i, 0);
    }

    // Fill in the actual data
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        const dow = parseInt(row.dow, 10);
        activityMap.set(dow, parseInt(row.count, 10));
      });
    }

    // Return as ordered array
    return Array.from({ length: 7 }, (_, i) => ({
      day: days[i],
      count: activityMap.get(i) || 0,
    }));
  }

  async getRevenueTrend(): Promise<RevenueTrendData[]> {
    const query = sql`
      SELECT
        DATE(started_at) as date,
        COALESCE(SUM((duration_mins::numeric / 60.0) * rate_per_hour), 0) as revenue
      FROM gaming_sessions
      WHERE started_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at)
    `;

    const result = await this.db.execute(query);

    if (Array.isArray(result)) {
      return result.map((row: any) => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
      }));
    }

    return [];
  }

  async getTotalRevenue(): Promise<number> {
    const query = sql`
      SELECT
        COALESCE(SUM((duration_mins::numeric / 60.0) * rate_per_hour), 0) as total
      FROM gaming_sessions
      WHERE status = 'completed'
    `;

    const result = await this.db.execute(query);

    if (Array.isArray(result) && result.length > 0) {
      return parseFloat(result[0].total);
    }

    return 0;
  }

  async getActiveSessions(): Promise<number> {
    const sessions = await this.db
      .select()
      .from(gamingSessions)
      .where(eq(gamingSessions.status, 'active'));

    return sessions.length;
  }
}
