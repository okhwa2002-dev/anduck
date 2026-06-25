import type { FastifyReply, FastifyRequest } from "fastify";
import * as db from "../utils/db";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "accessToken",
  "refreshToken",
  "csrfToken",
  "token",
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
]);

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitive);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, val]) => {
    acc[key] = SENSITIVE_KEYS.has(key) ? "[MASKED]" : maskSensitive(val);
    return acc;
  }, {});
}

function toJsonSafe(value: unknown): unknown {
  if (value === undefined) return null;
  if (Buffer.isBuffer(value)) return "[BINARY]";
  if (typeof value === "string") return value.length > 5000 ? `${value.slice(0, 5000)}...` : value;
  return maskSensitive(value);
}

function shouldAudit(request: FastifyRequest): boolean {
  if (!["POST", "PATCH", "DELETE"].includes(request.method)) return false;
  if (!request.user || !["ADMIN", "SUPER_ADMIN"].includes(request.user.userType)) return false;

  const url = request.url.split("?")[0];
  return url.startsWith("/admin/") || url.startsWith("/menus/") || url.startsWith("/files/");
}

const auditLogService = {
  async recordAdminAction(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!shouldAudit(request)) return;

    const payload = {
      params: toJsonSafe(request.params),
      query: toJsonSafe(request.query),
      body: toJsonSafe(request.body),
    };

    await db.rawQuery(
      `
      INSERT INTO admin_audit_log (
        user_id,
        user_type,
        method,
        path,
        route_path,
        status_code,
        ip_address,
        user_agent,
        request_payload
      )
      VALUES ($1::bigint, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      `,
      [
        request.user.sub,
        request.user.userType,
        request.method,
        request.url,
        request.routeOptions.url ?? null,
        reply.statusCode,
        request.ip,
        request.headers["user-agent"] ?? null,
        JSON.stringify(payload),
      ],
    );
  },
};

export default auditLogService;
