import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, inArray, or, sql } from 'drizzle-orm';
import { users, userStoreMemberships, stores } from '@org/api/db';

const BCRYPT_ROUNDS = 12;

export interface CreatePlayerInput {
  firstName: string;
  lastName: string;
  email?: string;
  cellphone?: string;
  password: string;
  storeIds: string[];
}

export interface UpdatePlayerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  cellphone?: string;
}

export interface PlayerResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cellphone?: string;
  stores: Array<{ id: string; name: string; role: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlayerStoresInput {
  storeIds: string[];
}

export class PlayerService {
  private db: ReturnType<typeof drizzle>;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async createPlayer(input: CreatePlayerInput): Promise<PlayerResponse> {
    const normalizedEmail = input.email?.toLowerCase().trim();
    const normalizedCellphone = input.cellphone?.trim();

    if (!normalizedEmail && !normalizedCellphone) {
      throw new Error('At least one of email or cellphone is required');
    }

    // Check if user already exists
    const existing = await this.findUserByCredential(
      normalizedEmail,
      normalizedCellphone,
    );

    if (existing) {
      throw new Error('User already exists with that email or phone');
    }

    // Validate all stores exist
    if (input.storeIds.length > 0) {
      const existingStores = await this.db
        .select({ id: stores.id })
        .from(stores)
        .where(inArray(stores.id, input.storeIds));

      if (existingStores.length !== input.storeIds.length) {
        throw new Error('One or more stores not found');
      }
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const [newUser] = await this.db
      .insert(users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalizedEmail ?? null,
        cellphone: normalizedCellphone ?? null,
        passwordHash,
      })
      .returning({ id: users.id, createdAt: users.createdAt, updatedAt: users.updatedAt });

    // Add user to stores with gamer role
    if (input.storeIds.length > 0) {
      await this.db.insert(userStoreMemberships).values(
        input.storeIds.map((storeId) => ({
          userId: newUser.id,
          storeId,
          role: 'gamer',
        })),
      );
    }

    return this.getPlayerById(newUser.id);
  }

  async getPlayer(playerId: string): Promise<PlayerResponse> {
    return this.getPlayerById(playerId);
  }

  async updatePlayer(playerId: string, input: UpdatePlayerInput): Promise<PlayerResponse> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, playerId));

    if (!user) {
      throw new Error('Player not found');
    }

    // If email or cellphone are being updated, check for duplicates in other players
    if (input.email || input.cellphone) {
      const normalizedEmail = input.email?.toLowerCase().trim();
      const normalizedCellphone = input.cellphone?.trim();

      const conditions = [];
      if (input.email) conditions.push(eq(users.email, normalizedEmail!));
      if (input.cellphone) conditions.push(eq(users.cellphone, normalizedCellphone!));

      let query = this.db
        .select({ id: users.id })
        .from(users);

      if (conditions.length > 0) {
        query = query.where(
          and(
            or(...conditions),
            // Exclude current user
          ),
        ) as any;
      }

      const existing = await query;
      const duplicates = existing.filter((record) => record.id !== playerId);

      if (duplicates.length > 0) {
        throw new Error('Email or phone already in use by another player');
      }
    }

    const updateData: any = {};
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.email !== undefined) updateData.email = input.email?.toLowerCase().trim() || null;
    if (input.cellphone !== undefined) updateData.cellphone = input.cellphone?.trim() || null;
    updateData.updatedAt = new Date();

    await this.db.update(users).set(updateData).where(eq(users.id, playerId));

    return this.getPlayerById(playerId);
  }

  async getAllPlayers(): Promise<PlayerResponse[]> {
    const allUsers = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        cellphone: users.cellphone,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    const players: PlayerResponse[] = [];

    for (const user of allUsers) {
      const storesForUser = await this.db
        .select({
          storeId: userStoreMemberships.storeId,
          role: userStoreMemberships.role,
          storeName: stores.name,
        })
        .from(userStoreMemberships)
        .innerJoin(stores, eq(stores.id, userStoreMemberships.storeId))
        .where(eq(userStoreMemberships.userId, user.id));

      players.push({
        id: user.id,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        email: user.email ?? undefined,
        cellphone: user.cellphone ?? undefined,
        stores: storesForUser.map((s) => ({
          id: s.storeId,
          name: s.storeName,
          role: s.role,
        })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    }

    return players;
  }

  async getPlayersByStore(storeId: string): Promise<PlayerResponse[]> {
    // Verify store exists
    const [store] = await this.db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store) {
      throw new Error('Store not found');
    }

    const storeUsers = await this.db
      .select({
        userId: userStoreMemberships.userId,
        role: userStoreMemberships.role,
      })
      .from(userStoreMemberships)
      .where(eq(userStoreMemberships.storeId, storeId));

    const players: PlayerResponse[] = [];

    for (const membership of storeUsers) {
      const [user] = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          cellphone: users.cellphone,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, membership.userId));

      if (user) {
        const allStores = await this.db
          .select({
            storeId: userStoreMemberships.storeId,
            role: userStoreMemberships.role,
            storeName: stores.name,
          })
          .from(userStoreMemberships)
          .innerJoin(stores, eq(stores.id, userStoreMemberships.storeId))
          .where(eq(userStoreMemberships.userId, user.id));

        players.push({
          id: user.id,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          email: user.email ?? undefined,
          cellphone: user.cellphone ?? undefined,
          stores: allStores.map((s) => ({
            id: s.storeId,
            name: s.storeName,
            role: s.role,
          })),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        });
      }
    }

    return players;
  }

  async linkPlayerToStores(
    playerId: string,
    storeIds: string[],
  ): Promise<PlayerResponse> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, playerId));

    if (!user) {
      throw new Error('Player not found');
    }

    // Validate all stores exist
    const existingStores = await this.db
      .select({ id: stores.id })
      .from(stores)
      .where(inArray(stores.id, storeIds));

    if (existingStores.length !== storeIds.length) {
      throw new Error('One or more stores not found');
    }

    // Check which stores the player is already linked to
    const existingMemberships = await this.db
      .select({ storeId: userStoreMemberships.storeId })
      .from(userStoreMemberships)
      .where(
        and(
          eq(userStoreMemberships.userId, playerId),
          inArray(userStoreMemberships.storeId, storeIds),
        ),
      );

    const existingStoreIds = existingMemberships.map((m) => m.storeId);
    const newStoreIds = storeIds.filter((id) => !existingStoreIds.includes(id));

    // Only add new memberships
    if (newStoreIds.length > 0) {
      await this.db.insert(userStoreMemberships).values(
        newStoreIds.map((storeId) => ({
          userId: playerId,
          storeId,
          role: 'gamer',
        })),
      );
    }

    return this.getPlayerById(playerId);
  }

  async unlinkPlayerFromStore(playerId: string, storeId: string): Promise<void> {
    const [membership] = await this.db
      .select({ userId: userStoreMemberships.userId })
      .from(userStoreMemberships)
      .where(
        and(
          eq(userStoreMemberships.userId, playerId),
          eq(userStoreMemberships.storeId, storeId),
        ),
      );

    if (!membership) {
      throw new Error('Player is not linked to this store');
    }

    await this.db
      .delete(userStoreMemberships)
      .where(
        and(
          eq(userStoreMemberships.userId, playerId),
          eq(userStoreMemberships.storeId, storeId),
        ),
      );
  }

  async deletePlayer(playerId: string): Promise<void> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, playerId));

    if (!user) {
      throw new Error('Player not found');
    }

    // This will cascade delete userStoreMemberships and refreshTokens due to foreign key constraints
    await this.db.delete(users).where(eq(users.id, playerId));
  }

  private async getPlayerById(playerId: string): Promise<PlayerResponse> {
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        cellphone: users.cellphone,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, playerId));

    if (!user) {
      throw new Error('Player not found');
    }

    const storesForUser = await this.db
      .select({
        storeId: userStoreMemberships.storeId,
        role: userStoreMemberships.role,
        storeName: stores.name,
      })
      .from(userStoreMemberships)
      .innerJoin(stores, eq(stores.id, userStoreMemberships.storeId))
      .where(eq(userStoreMemberships.userId, playerId));

    return {
      id: user.id,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email ?? undefined,
      cellphone: user.cellphone ?? undefined,
      stores: storesForUser.map((s) => ({
        id: s.storeId,
        name: s.storeName,
        role: s.role,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async findUserByCredential(
    email: string | undefined,
    cellphone: string | undefined,
  ) {
    if (!email && !cellphone) return null;

    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (cellphone) conditions.push(eq(users.cellphone, cellphone));

    let result;
    if (conditions.length === 1) {
      result = await this.db
        .select()
        .from(users)
        .where(conditions[0]);
    } else {
      result = await this.db
        .select()
        .from(users)
        .where(or(conditions[0], conditions[1]));
    }

    return result[0] || null;
  }
}
