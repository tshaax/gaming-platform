export type UserRole = 'gamer' | 'cashier' | 'admin';

export interface User {
  id: string;
  email: string | null;
  cellphone: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface UserStoreMembership {
  userId: string;
  storeId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  storeId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface JwtAccessPayload {
  sub: string;
  storeId: string;
  role: UserRole;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  storeId: string;
  tokenId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface RegisterRequest {
  email?: string;
  cellphone?: string;
  password: string;
  storeId: string;
  role?: UserRole;
}

export interface LoginRequest {
  email?: string;
  cellphone?: string;
  password: string;
  storeId?: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
