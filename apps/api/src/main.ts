import express from 'express';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';
import { ProductsService } from '@org/api/products';
import { AuthService, createAuthRouter } from '@org/api/auth';
import { CashierService, createCashierRouter } from '@org/api/cashier';
import { StoreService, createStoreRouter } from '@org/api/store';
import {
  GamingSessionService,
  createGamingSessionRouter,
  ResultsService,
  createResultsRouter,
} from '@org/api/gaming-session';
import { EventService, createEventRouter } from '@org/api/event';
import { PlayerService, createPlayerRouter } from '@org/api/player';
import { AnalyticsService, createAnalyticsRouter } from '@org/api/analytics';
import { LeaderboardService } from './leaderboard.service';
import { createLeaderboardRouter } from './leaderboard.router';
import { PromotionService } from './promotions.service';
import { createPromotionRouter } from './promotions.router';
import {
  ApiResponse,
  Product,
  ProductFilter,
  PaginatedResponse,
} from '@org/models';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

// Initialize express app
const app = express();
const productsService = new ProductsService();

// Middleware setup
app.use(express.json());

// CORS — allow configured origins, or all in development
const allowedOrigins = (process.env['CORS_ALLOWED_ORIGINS'] ?? '*').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    allowedOrigins.includes('*') ||
    (origin && allowedOrigins.includes(origin))
  ) {
    res.header('Access-Control-Allow-Origin', origin ?? '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Auth setup
const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

// Rate limiting — more generous in development, stricter in production
const authLimiterConfig = {
  windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] ?? 15 * 60 * 100000), // 15 min default
  max: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? 10000), // 100 requests default (dev-friendly)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many requests, please try again later',
  },
};

const authLimiter = rateLimit(authLimiterConfig);
app.use('/api/auth', authLimiter, createAuthRouter(new AuthService(pool)));

// Cashier management
app.use('/api/cashiers', createCashierRouter(new CashierService(pool)));

// Store management
app.use('/api/stores', createStoreRouter(new StoreService(pool)));

// Gaming sessions
app.use(
  '/api/gaming-sessions',
  createGamingSessionRouter(new GamingSessionService(pool)),
);

// Game results
app.use('/api/game-results', createResultsRouter(new ResultsService(pool)));

// Events
app.use('/api/events', createEventRouter(new EventService(pool)));

// Players
app.use('/api/players', createPlayerRouter(new PlayerService(pool)));

// Analytics
app.use('/api/analytics', createAnalyticsRouter(new AnalyticsService(pool)));

// Leaderboard
app.use('/api/leaderboard', createLeaderboardRouter(new LeaderboardService(pool)));

// Promotions
app.use('/api/promotions', createPromotionRouter(new PromotionService(pool)));

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
