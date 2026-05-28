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
} from '@org/api/gaming-session';
import {
  ApiResponse,
  Product,
  ProductFilter,
  PaginatedResponse,
} from '@org/models';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const app = express();
const productsService = new ProductsService();

// Middleware
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

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
