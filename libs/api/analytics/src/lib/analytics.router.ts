import { Router } from 'express';
import { AnalyticsService } from './analytics.service';

export function createAnalyticsRouter(analyticsService: AnalyticsService): Router {
  const router = Router();

  router.get('/weekly-activity', async (req, res) => {
    try {
      const data = await analyticsService.getWeeklyActivity();
      res.json({ data });
    } catch (error) {
      console.error('Failed to get weekly activity:', error);
      res.status(500).json({ error: 'Failed to get weekly activity' });
    }
  });

  router.get('/revenue-trend', async (req, res) => {
    try {
      const data = await analyticsService.getRevenueTrend();
      res.json({ data });
    } catch (error) {
      console.error('Failed to get revenue trend:', error);
      res.status(500).json({ error: 'Failed to get revenue trend' });
    }
  });

  router.get('/total-revenue', async (req, res) => {
    try {
      const revenue = await analyticsService.getTotalRevenue();
      res.json({ data: revenue });
    } catch (error) {
      console.error('Failed to get total revenue:', error);
      res.status(500).json({ error: 'Failed to get total revenue' });
    }
  });

  router.get('/active-sessions', async (req, res) => {
    try {
      const count = await analyticsService.getActiveSessions();
      res.json({ data: count });
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      res.status(500).json({ error: 'Failed to get active sessions' });
    }
  });

  router.get('/completed-sessions', async (req, res) => {
    try {
      const count = await analyticsService.getCompletedSessions();
      res.json({ data: count });
    } catch (error) {
      console.error('Failed to get completed sessions:', error);
      res.status(500).json({ error: 'Failed to get completed sessions' });
    }
  });

  router.get('/total-hours', async (req, res) => {
    try {
      const hours = await analyticsService.getTotalHours();
      res.json({ data: hours });
    } catch (error) {
      console.error('Failed to get total hours:', error);
      res.status(500).json({ error: 'Failed to get total hours' });
    }
  });

  router.get('/revenue-by-station', async (req, res) => {
    try {
      const data = await analyticsService.getRevenueByStation();
      res.json({ data });
    } catch (error) {
      console.error('Failed to get revenue by station:', error);
      res.status(500).json({ error: 'Failed to get revenue by station' });
    }
  });

  router.get('/metrics', async (req, res) => {
    try {
      const metrics = await analyticsService.getReportMetrics();
      res.json({ data: metrics });
    } catch (error) {
      console.error('Failed to get report metrics:', error);
      res.status(500).json({ error: 'Failed to get report metrics' });
    }
  });

  return router;
}
