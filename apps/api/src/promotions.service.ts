import { Pool } from 'pg';
import { Promotion } from '@org/models';

export class PromotionService {
  private promotions: Map<string, Promotion> = new Map();
  private nextId = 1;

  constructor(private pool: Pool) {
    this.initializeMockPromotions();
  }

  private initializeMockPromotions(): void {
    const mockPromotions: Promotion[] = [
      {
        id: 'promo-1',
        storeId: 'store-1',
        title: 'Summer Sale',
        type: 'percentage',
        promoCode: 'SUMMER20',
        discountValue: 20,
        status: 'active',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        targetAudience: 'all',
        maxUsage: 1000,
        currentUsage: 250,
        description: '20% off all summer products',
      },
      {
        id: 'promo-2',
        storeId: 'store-1',
        title: 'First Purchase',
        type: 'fixed',
        promoCode: 'WELCOME10',
        discountValue: 10,
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        targetAudience: 'new-customers',
        maxUsage: 5000,
        currentUsage: 1200,
        description: '$10 off first purchase',
      },
      {
        id: 'promo-3',
        storeId: 'store-2',
        title: 'Flash Deal',
        type: 'percentage',
        promoCode: 'FLASH50',
        discountValue: 50,
        status: 'active',
        startDate: '2026-05-31',
        endDate: '2026-06-02',
        targetAudience: 'all',
        maxUsage: 100,
        currentUsage: 85,
        description: '50% off selected items',
      },
    ];

    mockPromotions.forEach((promo) => {
      this.promotions.set(promo.id, promo);
      const id = parseInt(promo.id.split('-')[1], 10);
      if (id >= this.nextId) {
        this.nextId = id + 1;
      }
    });
  }

  async getAllPromotions(status?: string, storeId?: string): Promise<Promotion[]> {
    let result = Array.from(this.promotions.values());

    if (status) {
      result = result.filter((p) => p.status === status);
    }

    if (storeId && storeId !== 'all') {
      result = result.filter((p) => p.storeId === storeId);
    }

    return result;
  }

  async getPromotion(id: string): Promise<Promotion | null> {
    return this.promotions.get(id) || null;
  }

  async createPromotion(input: Partial<Promotion>): Promise<Promotion> {
    const id = `promo-${this.nextId++}`;
    const promotion: Promotion = {
      id,
      storeId: input.storeId,
      title: input.title || '',
      type: input.type || '',
      promoCode: input.promoCode || '',
      discountValue: input.discountValue,
      status: input.status || 'active',
      startDate: input.startDate || '',
      endDate: input.endDate || '',
      targetAudience: input.targetAudience,
      maxUsage: input.maxUsage,
      currentUsage: 0,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.promotions.set(id, promotion);
    return promotion;
  }

  async updatePromotion(
    id: string,
    input: Partial<Promotion>
  ): Promise<Promotion | null> {
    const existing = this.promotions.get(id);
    if (!existing) {
      return null;
    }

    const updated: Promotion = {
      ...existing,
      ...input,
      id,
      updatedAt: new Date(),
    };

    this.promotions.set(id, updated);
    return updated;
  }

  async deletePromotion(id: string): Promise<boolean> {
    return this.promotions.delete(id);
  }

  async lookupPromoCode(promoCode: string, storeId?: string): Promise<Promotion | null> {
    const code = promoCode.toUpperCase();
    const result = Array.from(this.promotions.values()).find((p) => {
      const codeMatch = p.promoCode.toUpperCase() === code;
      const storeMatch = !storeId || p.storeId === storeId || p.storeId === 'all';
      const statusMatch = p.status === 'active';

      // Check if promo is within valid date range
      const now = new Date();
      const startDate = new Date(p.startDate);
      const endDate = new Date(p.endDate);
      const dateMatch = now >= startDate && now <= endDate;

      // Check if max usage reached
      const usageMatch = !p.maxUsage || p.currentUsage < p.maxUsage;

      return codeMatch && storeMatch && statusMatch && dateMatch && usageMatch;
    });

    return result || null;
  }
}
