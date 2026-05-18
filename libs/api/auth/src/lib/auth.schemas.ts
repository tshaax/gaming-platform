import { z } from 'zod';

const emailOrPhone = z
  .object({
    email:     z.string().email().optional(),
    cellphone: z.string().min(7).max(20).optional(),
  })
  .refine((d) => d.email !== undefined || d.cellphone !== undefined, {
    message: 'At least one of email or cellphone is required',
  });

export const registerSchema = emailOrPhone.extend({
  password: z.string().min(8).max(128),
  storeId:  z.string().uuid(),
  role:     z.enum(['gamer', 'cashier', 'admin']).optional().default('gamer'),
});

export const loginSchema = emailOrPhone.extend({
  password: z.string().min(1),
  storeId:  z.string().uuid().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
export type RefreshInput  = z.infer<typeof refreshSchema>;
export type LogoutInput   = z.infer<typeof logoutSchema>;
