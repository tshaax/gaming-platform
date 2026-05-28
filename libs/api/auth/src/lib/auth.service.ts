import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, or, and, isNull, gt } from 'drizzle-orm';
import {
  users,
  stores,
  userStoreMemberships,
  refreshTokens,
} from '@org/api/db';
import type {
  AuthTokens,
  JwtAccessPayload,
  JwtRefreshPayload,
  UserRole,
} from '@org/models';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schemas';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = 15 * 60;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

function authError(message: string, code: string): Error {
  const err = new Error(message) as Error & { code: string };
  err.code = code;
  return err;
}

export class AuthService {
  private db: ReturnType<typeof drizzle>;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async register(input: RegisterInput): Promise<AuthTokens> {
    const normalizedEmail = input.email?.toLowerCase().trim();
    const normalizedCellphone = input.cellphone?.trim();

    const [store] = await this.db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.id, input.storeId))
      .limit(1);

    if (!store) {
      throw authError('Store not found', 'STORE_NOT_FOUND');
    }

    // Look up existing user by email or cellphone
    const existing = await this.findUserByCredential(
      normalizedEmail,
      normalizedCellphone,
    );

    let userId: string;

    if (existing) {
      // Returning user joining a new store — verify password to prove ownership
      const valid = await bcrypt.compare(input.password, existing.passwordHash);
      if (!valid) {
        throw authError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Check membership doesn't already exist for this store
      const [membership] = await this.db
        .select({ userId: userStoreMemberships.userId })
        .from(userStoreMemberships)
        .where(
          and(
            eq(userStoreMemberships.userId, existing.id),
            eq(userStoreMemberships.storeId, input.storeId),
          ),
        )
        .limit(1);

      if (membership) {
        throw authError('User already registered at this store', 'USER_EXISTS');
      }

      userId = existing.id;
    } else {
      // New user
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      const [newUser] = await this.db
        .insert(users)
        .values({
          email: normalizedEmail ?? null,
          cellphone: normalizedCellphone ?? null,
          passwordHash,
        })
        .returning({ id: users.id });

      userId = newUser.id;
    }

    const role = (input.role ?? 'gamer') as UserRole;

    await this.db.insert(userStoreMemberships).values({
      userId,
      storeId: input.storeId,
      role,
    });

    return this.issueTokens(userId, input.storeId, role);
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const normalizedEmail = input.email?.toLowerCase().trim();
    const normalizedCellphone = input.cellphone?.trim();

    const user = await this.findUserByCredential(
      normalizedEmail,
      normalizedCellphone,
    );

    if (!user) {
      throw authError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw authError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    let storeId = input.storeId;
    let membership;

    if (storeId) {
      const [m] = await this.db
        .select({ role: userStoreMemberships.role })
        .from(userStoreMemberships)
        .where(
          and(
            eq(userStoreMemberships.userId, user.id),
            eq(userStoreMemberships.storeId, storeId),
          ),
        )
        .limit(1);

      if (!m) {
        throw authError(
          'User not registered at this store',
          'MEMBERSHIP_NOT_FOUND',
        );
      }
      membership = m;
    } else {
      const [m] = await this.db
        .select({
          storeId: userStoreMemberships.storeId,
          role: userStoreMemberships.role,
        })
        .from(userStoreMemberships)
        .where(eq(userStoreMemberships.userId, user.id))
        .limit(1);

      if (!m) {
        throw authError(
          'User not registered at any store',
          'MEMBERSHIP_NOT_FOUND',
        );
      }
      storeId = m.storeId;
      membership = m;
    }

    return this.issueTokens(user.id, storeId, membership.role as UserRole);
  }

  async refresh(
    input: RefreshInput,
  ): Promise<Pick<AuthTokens, 'accessToken' | 'expiresIn'>> {
    const secret = process.env['JWT_SECRET']!;
    let payload: JwtRefreshPayload;

    try {
      payload = jwt.verify(input.refreshToken, secret) as JwtRefreshPayload;
    } catch {
      throw authError('Invalid or expired refresh token', 'TOKEN_INVALID');
    }

    if (payload.type !== 'refresh') {
      throw authError('Invalid token type', 'TOKEN_INVALID');
    }

    const tokenHash = this.hashToken(input.refreshToken);
    const now = new Date();

    const [storedToken] = await this.db
      .select({
        revokedAt: refreshTokens.revokedAt,
        expiresAt: refreshTokens.expiresAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!storedToken) {
      throw authError('Token not found', 'TOKEN_INVALID');
    }
    if (storedToken.revokedAt !== null) {
      throw authError('Token has been revoked', 'TOKEN_REVOKED');
    }
    if (storedToken.expiresAt < now) {
      throw authError('Token has expired', 'TOKEN_EXPIRED');
    }

    const [membership] = await this.db
      .select({ role: userStoreMemberships.role })
      .from(userStoreMemberships)
      .where(
        and(
          eq(userStoreMemberships.userId, payload.sub),
          eq(userStoreMemberships.storeId, payload.storeId),
        ),
      )
      .limit(1);

    if (!membership) {
      throw authError('Membership no longer exists', 'MEMBERSHIP_NOT_FOUND');
    }

    const accessToken = jwt.sign(
      {
        sub: payload.sub,
        storeId: payload.storeId,
        role: membership.role as UserRole,
        type: 'access',
      } satisfies Omit<JwtAccessPayload, 'iat' | 'exp'>,
      secret,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    return { accessToken, expiresIn: ACCESS_TOKEN_TTL };
  }

  async logout(input: RefreshInput): Promise<void> {
    const secret = process.env['JWT_SECRET']!;

    try {
      jwt.verify(input.refreshToken, secret);
    } catch {
      // Expired tokens should still be revokable if they exist in DB
    }

    const tokenHash = this.hashToken(input.refreshToken);

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  private async issueTokens(
    userId: string,
    storeId: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    const secret = process.env['JWT_SECRET']!;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL * 1000);

    // Insert a placeholder row first to get the tokenId (UUID)
    const [tokenRow] = await this.db
      .insert(refreshTokens)
      .values({
        userId,
        storeId,
        tokenHash: crypto.randomBytes(32).toString('hex'), // temporary; updated below
        expiresAt,
      })
      .returning({ id: refreshTokens.id });

    const refreshPayload: Omit<JwtRefreshPayload, 'iat' | 'exp'> = {
      sub: userId,
      storeId,
      tokenId: tokenRow.id,
      type: 'refresh',
    };

    const refreshToken = jwt.sign(refreshPayload, secret, {
      expiresIn: REFRESH_TOKEN_TTL,
    });
    const tokenHash = this.hashToken(refreshToken);

    // Update row with real hash
    await this.db
      .update(refreshTokens)
      .set({ tokenHash })
      .where(eq(refreshTokens.id, tokenRow.id));

    const accessPayload: Omit<JwtAccessPayload, 'iat' | 'exp'> = {
      sub: userId,
      storeId,
      role,
      type: 'access',
    };
    const accessToken = jwt.sign(accessPayload, secret, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL };
  }

  private async findUserByCredential(email?: string, cellphone?: string) {
    if (!email && !cellphone) return null;

    try {
      const conditions = [];
      if (email) conditions.push(eq(users.email, email));
      if (cellphone) conditions.push(eq(users.cellphone, cellphone));

      const [user] = await this.db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(conditions.length === 1 ? conditions[0] : or(...conditions))
        .limit(1);

      return user ?? null;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async getUserStores(
    userId: string,
  ): Promise<Array<{ id: string; name: string; slug: string }>> {
    return this.db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
      })
      .from(userStoreMemberships)
      .innerJoin(stores, eq(userStoreMemberships.storeId, stores.id))
      .where(eq(userStoreMemberships.userId, userId));
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
