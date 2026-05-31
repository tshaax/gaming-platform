export interface Promotion {
  id: string;
  storeId?: string;
  title: string;
  type: string;
  promoCode: string;
  discountValue?: number;
  status: string;
  startDate: string;
  endDate: string;
  targetAudience?: string;
  maxUsage?: number;
  currentUsage: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
