import type { YN } from "./common";

export enum UserType {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export const USER_TYPE_RANK: Record<UserType, number> = {
  [UserType.MEMBER]: 1,
  [UserType.ADMIN]: 2,
  [UserType.SUPER_ADMIN]: 3,
};

export function hasUserType(userType: UserType, required: UserType): boolean {
  return USER_TYPE_RANK[userType] >= USER_TYPE_RANK[required];
}

export interface User {
  id: string;
  loginId: string;
  email: string;
  name: string;
  phone?: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface SignupRequest {
  loginId: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshToken {
  id: string;
  userId: string;
  userAgent?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface PushToken {
  id: string;
  userId?: string;
  token: string;
  platform: "ios" | "android";
  activeYn: YN;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPushTokenInput {
  token: string;
  platform: "ios" | "android";
}
