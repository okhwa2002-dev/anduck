import type { FilterCondition, Paginated } from "@anduck/types";
import { Errors } from "./errors";

type PageQ = { page?: number; pageSize?: number; all?: boolean };

/** DB 레벨 페이징용 LIMIT/OFFSET SQL 조각 생성. all=true 이면 빈 문자열 반환 */
export function limitOffsetSQL(q: PageQ): string {
  if (q.all) return "";
  const page = Math.max(1, q.page ?? 1);
  const size = Math.min(200, Math.max(1, q.pageSize ?? 20));
  return `LIMIT ${size} OFFSET ${(page - 1) * size}`;
}

/** DB COUNT 결과 + 항목 배열로 Paginated 객체 생성 */
export function toPaged<T>(items: T[], total: number, q: PageQ): Paginated<T> {
  if (q.all) {
    const n = items.length;
    return { items, total: n, page: 1, pageSize: n, totalPages: 1 };
  }
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, q.pageSize ?? 20));
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export function toId(id: string | number | bigint | null | undefined): string {
  return String(id ?? "");
}

export function toOptionalId(id: string | number | bigint | null | undefined): string | undefined {
  return id != null && id !== "" ? String(id) : undefined;
}

export function toDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  return date instanceof Date ? date.toISOString() : date;
}

export function toDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "";
  const s = date instanceof Date ? date.toISOString() : date;
  return s.slice(0, 10);
}

export function notFound(message?: string): never {
  throw Errors.notFound(message);
}

// ─── PostgreSQL raw-value helpers (used with ${} in mapper XML) ────────────

/** Validate and format a single bigint ID for raw SQL substitution */
export function pgId(id?: string | null): string {
  if (!id) return "NULL";
  if (!/^\d+$/.test(id)) throw Errors.badRequest(`유효하지 않은 ID입니다: ${id}`);
  return id;
}

/** Format a bigint array for raw SQL: ARRAY[1,2,3]::bigint[] */
export function pgBigintArr(ids?: string[] | null): string {
  if (!ids || !ids.length) return "ARRAY[]::bigint[]";
  ids.forEach((id) => { if (!/^\d+$/.test(id)) throw Errors.badRequest(`유효하지 않은 ID입니다: ${id}`); });
  return `ARRAY[${ids.join(",")}]::bigint[]`;
}

/** Format a text array for raw SQL: ARRAY['Mon','Tue']::text[] */
export function pgTextArr(vals?: string[] | null): string {
  if (!vals || !vals.length) return "ARRAY[]::text[]";
  const escaped = vals.map((v) => `'${v.replace(/'/g, "''")}'`);
  return `ARRAY[${escaped.join(",")}]::text[]`;
}

/** Format an object as JSONB literal for raw SQL */
export function pgJsonb(obj?: object | null): string {
  if (!obj) return "NULL";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

/** Format a nullable string for raw SQL (handles NULL) */
export function pgStr(val?: string | null): string {
  if (val == null) return "NULL";
  return `'${val.replace(/'/g, "''")}'`;
}

/** Format a nullable number for raw SQL */
export function pgNum(val?: number | null): string {
  if (val == null) return "NULL";
  return String(val);
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function parseFilters(raw: FilterCondition[] | string | undefined): FilterCondition[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

/** filters 배열에서 특정 field의 값을 추출. 없으면 null */
export function filterVal(
  filters: FilterCondition[] | string | undefined,
  field: string,
): string | null {
  const list = parseFilters(filters);
  const found = list.find((f) => f.field === field);
  if (!found) return null;
  return Array.isArray(found.value) ? found.value[0] ?? null : found.value;
}

/** filters 배열에서 특정 field의 값을 배열로 추출. 없으면 null */
export function filterVals(
  filters: FilterCondition[] | string | undefined,
  field: string,
): string[] | null {
  const list = parseFilters(filters);
  const found = list.find((f) => f.field === field);
  if (!found) return null;
  return Array.isArray(found.value) ? found.value : [found.value];
}
