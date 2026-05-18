import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { users, cashiers, stores, userStoreMemberships } from '@org/api/db';

export interface CreateCashierInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  storeId: string;
  password: string;
}

export interface UpdateCashierInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export class CashierService {
  private db: any;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async createCashier(input: CreateCashierInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
      })
      .returning({ id: users.id });

    await this.db.insert(userStoreMemberships).values({
      userId: user.id,
      storeId: input.storeId,
      role: 'cashier',
    });

    const [cashier] = await this.db
      .insert(cashiers)
      .values({
        userId: user.id,
        storeId: input.storeId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordResetRequired: true,
      })
      .returning();

    return cashier;
  }

  async getCashiersByStore(storeId: string) {
    return this.db
      .select({
        id: cashiers.id,
        userId: cashiers.userId,
        firstName: cashiers.firstName,
        lastName: cashiers.lastName,
        email: cashiers.email,
        phone: cashiers.phone,
        passwordResetRequired: cashiers.passwordResetRequired,
        createdAt: cashiers.createdAt,
        storeName: stores.name,
      })
      .from(cashiers)
      .leftJoin(stores, eq(cashiers.storeId, stores.id))
      .where(eq(cashiers.storeId, storeId));
  }

  async getAllCashiers() {
    return this.db
      .select({
        id: cashiers.id,
        userId: cashiers.userId,
        firstName: cashiers.firstName,
        lastName: cashiers.lastName,
        email: cashiers.email,
        phone: cashiers.phone,
        passwordResetRequired: cashiers.passwordResetRequired,
        createdAt: cashiers.createdAt,
        storeName: stores.name,
        storeId: cashiers.storeId,
      })
      .from(cashiers)
      .leftJoin(stores, eq(cashiers.storeId, stores.id));
  }

  async updateCashier(cashierId: string, input: UpdateCashierInput) {
    const [updated] = await this.db
      .update(cashiers)
      .set(input)
      .where(eq(cashiers.id, cashierId))
      .returning();

    return updated;
  }

  async deleteCashier(cashierId: string) {
    const cashier = await this.db
      .select({ userId: cashiers.userId })
      .from(cashiers)
      .where(eq(cashiers.id, cashierId))
      .limit(1);

    if (cashier.length === 0) {
      throw new Error('Cashier not found');
    }

    await this.db.delete(cashiers).where(eq(cashiers.id, cashierId));
    await this.db.delete(users).where(eq(users.id, cashier[0].userId));

    return { success: true };
  }

  async markPasswordReset(cashierId: string) {
    return this.db
      .update(cashiers)
      .set({ passwordResetRequired: false })
      .where(eq(cashiers.id, cashierId))
      .returning();
  }
}
