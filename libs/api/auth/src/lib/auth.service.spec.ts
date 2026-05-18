import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';

// Build a drizzle-like fluent query chain that resolves to `rows`
function makeDb(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'limit', 'insert',
                    'values', 'returning', 'update', 'set']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['then']  = (res: (v: unknown) => unknown) => Promise.resolve(rows).then(res);
  chain['catch'] = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
  return chain;
}

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => makeDb([])),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash:    vi.fn().mockResolvedValue('$2b$hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign:   vi.fn().mockReturnValue('signed.jwt'),
    verify: vi.fn().mockReturnValue({ sub: 'u1', storeId: 's1', tokenId: 't1', type: 'refresh' }),
  },
}));

import { AuthService } from './auth.service';

const fakePool = {} as Pool;

beforeEach(() => {
  vi.clearAllMocks();
  process.env['JWT_SECRET'] = 'test-secret';
});

describe('AuthService', () => {
  it('is instantiable', () => {
    expect(new AuthService(fakePool)).toBeInstanceOf(AuthService);
  });

  it('login throws INVALID_CREDENTIALS when no user found', async () => {
    // drizzle mock returns [] for every query — user lookup returns empty
    const svc = new AuthService(fakePool);

    await expect(
      svc.login({ email: 'nobody@test.com', password: 'pass', storeId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('login throws INVALID_CREDENTIALS on wrong password', async () => {
    const bcrypt = await import('bcryptjs');
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

    // Return a user row so findUserByCredential succeeds, but password check fails
    const { drizzle } = await import('drizzle-orm/node-postgres');
    vi.mocked(drizzle).mockReturnValue(makeDb([{ id: 'u1', passwordHash: '$2b$hashed' }]) as never);

    const svc = new AuthService(fakePool);

    await expect(
      svc.login({ email: 'user@test.com', password: 'wrong', storeId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});
