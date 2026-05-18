import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { stores } from '@org/api/db';

export interface CreateStoreInput {
  name: string;
  slug: string;
  address?: string;
  taxNumber?: string;
  manager?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  slug?: string;
  address?: string;
  taxNumber?: string;
  manager?: string;
  contactPerson?: string;
  contactPhone?: string;
}

export class StoreService {
  private db: any;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async createStore(input: CreateStoreInput) {
    const [store] = await this.db
      .insert(stores)
      .values({
        name: input.name,
        slug: input.slug,
        address: input.address,
        taxNumber: input.taxNumber,
        manager: input.manager,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
      })
      .returning();

    return store;
  }

  async getAllStores() {
    return this.db.select().from(stores);
  }

  async getStore(storeId: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  }

  async updateStore(storeId: string, input: UpdateStoreInput) {
    const [updated] = await this.db
      .update(stores)
      .set(input)
      .where(eq(stores.id, storeId))
      .returning();

    if (!updated) {
      throw new Error('Store not found');
    }

    return updated;
  }

  async deleteStore(storeId: string) {
    const [deleted] = await this.db
      .delete(stores)
      .where(eq(stores.id, storeId))
      .returning();

    if (!deleted) {
      throw new Error('Store not found');
    }

    return { success: true };
  }
}
