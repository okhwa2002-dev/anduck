import { Pool } from "pg";
import mybatisMapper from "mybatis-mapper";
import { join } from "path";
import { readdirSync } from "fs";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let mappersLoaded = false;

export function loadMappers() {
  if (mappersLoaded) return;
  const mapperDir = join(__dirname, "..", "mapper");
  const files = readdirSync(mapperDir)
    .filter((f) => f.endsWith(".xml"))
    .map((f) => join(mapperDir, f));
  mybatisMapper.createMapper(files);
  mappersLoaded = true;
}

const FMT = { language: "sql" as const, indent: "  " };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapperParams = Record<string, any>;

export function buildSQL(namespace: string, id: string, params?: MapperParams): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mybatisMapper.getStatement(namespace, id, (params ?? {}) as any, FMT);
}

export async function query<T = Record<string, unknown>>(
  namespace: string,
  id: string,
  params?: MapperParams,
): Promise<T[]> {
  const sql = buildSQL(namespace, id, params);
  const result = await pool.query(sql);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  namespace: string,
  id: string,
  params?: MapperParams,
): Promise<T | null> {
  const rows = await query<T>(namespace, id, params);
  return rows[0] ?? null;
}

export async function execute(
  namespace: string,
  id: string,
  params?: MapperParams,
): Promise<{ rowCount: number; rows: Record<string, unknown>[] }> {
  const sql = buildSQL(namespace, id, params);
  const result = await pool.query(sql);
  return { rowCount: result.rowCount ?? 0, rows: result.rows };
}

export async function rawQuery<T = Record<string, unknown>>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  const result = await pool.query(sql, values);
  return result.rows as T[];
}

export async function rawQueryOne<T = Record<string, unknown>>(
  sql: string,
  values?: unknown[],
): Promise<T | null> {
  const rows = await rawQuery<T>(sql, values);
  return rows[0] ?? null;
}
