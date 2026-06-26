import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import * as db from "../utils/db";
import * as utils from "../utils";
import { Errors } from "../utils/errors";

export type UserRow = {
  id: string;
  loginId: string;
  email: string;
  name: string;
  phone: string | null;
  userType: string;
  failedLoginCount: number;
  lockedUntil: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type UserWithHash = UserRow & { passwordHash: string };

type RefreshTokenRow = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date | string;
  lastUsedAt: Date | string;
  revokedAt: Date | string | null;
};

function toDate(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

function parseDuration(s: string): number {
  const m = s.match(/^(\d+)(s|m|h|d|w)$/);
  if (m) {
    const n = parseInt(m[1]);
    const units: Record<string, number> = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3, w: 604800e3 };
    return n * units[m[2]];
  }
  const secs = parseInt(s);
  return (isNaN(secs) ? 7 * 86400 : secs) * 1e3;
}

function mapUser(r: UserRow) {
  return {
    id: r.id,
    loginId: r.loginId,
    email: r.email,
    name: r.name,
    phone: r.phone ?? undefined,
    userType: r.userType,
    createdAt: toDate(r.createdAt),
    updatedAt: toDate(r.updatedAt),
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isRefreshTokenIdleExpired(token: RefreshTokenRow, now = new Date()): boolean {
  const idleTimeout = parseDuration(process.env.JWT_IDLE_TIMEOUT ?? "30m");
  const lastUsedAt = new Date(token.lastUsedAt).getTime();
  return now.getTime() - lastUsedAt > idleTimeout;
}

function getLoginMaxFailures(): number {
  const n = parseInt(process.env.LOGIN_MAX_FAILURES ?? "5", 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function isAccountLocked(user: UserWithHash, now = new Date()): boolean {
  return user.lockedUntil ? new Date(user.lockedUntil).getTime() > now.getTime() : false;
}

const authService = {
  async validateCredentials(loginId: string, password: string) {
    const user = await db.queryOne<UserWithHash>("auth", "getUserByLoginId", { loginId });
    if (!user) return null;

    if (isAccountLocked(user)) {
      throw Errors.badRequest("계정이 잠겨 있습니다. 잠시 후 다시 시도해 주세요.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await db.execute("auth", "recordLoginFailure", {
        loginId,
        maxFailures: getLoginMaxFailures(),
        lockSeconds: Math.floor(parseDuration(process.env.LOGIN_LOCK_DURATION ?? "30m") / 1000),
      });
      return null;
    }

    await db.execute("auth", "clearLoginFailures", {
      id: utils.pgId(user.id),
    });
    return mapUser(user);
  },

  async createUser(loginId: string, email: string, password: string, name: string, phone?: string, userType = "MEMBER") {
    const passwordHash = await bcrypt.hash(password, 10);
    const row = await db.queryOne<UserRow>("auth", "createUser", {
      loginId,
      email,
      passwordHash,
      name,
      phone: phone ?? null,
      userType,
    });
    if (!row) throw new Error("사용자 생성에 실패했습니다");
    await db.execute("auth", "assignDefaultPermissions", {
      userId: utils.pgId(row.id),
      userType: row.userType,
    });
    return mapUser(row);
  },

  async getUserById(id: string) {
    const row = await db.queryOne<UserRow>("auth", "getUserById", { id: utils.pgId(id) });
    return row ? mapUser(row) : null;
  },

  async saveRefreshToken(userId: string, token: string, userAgent?: string) {
    const expiresAt = new Date(Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")).toISOString();
    await db.execute("auth", "createRefreshToken", {
      userId: utils.pgId(userId),
      tokenHash: hashToken(token),
      userAgent: userAgent ?? null,
      expiresAt,
    });
  },

  async getRefreshToken(token: string): Promise<RefreshTokenRow | null> {
    return db.queryOne<RefreshTokenRow>("auth", "getRefreshToken", { tokenHash: hashToken(token) });
  },

  isRefreshTokenIdleExpired,

  async revokeToken(userId: string, token: string) {
    await db.execute("auth", "revokeUserRefreshToken", {
      userId: utils.pgId(userId),
      tokenHash: hashToken(token),
    });
  },
};

export default authService;
