import type * as types from "@anduck/types";
import * as db from "../utils/db";
import * as utils from "../utils";

type CodeRow = {
  groupId: string;
  groupCode: string;
  groupName: string;
  groupDescription?: string | null;
  groupUseYn: types.YN;
  groupSortOrder: number;
  groupCreatedAt: string;
  groupUpdatedAt: string;
  id?: string | null;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  extra?: Record<string, unknown> | null;
  useYn?: types.YN | null;
  sortOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function normalizeGroupCodes(raw?: string | string[]): string[] | null {
  if (!raw) return null;
  const values = Array.isArray(raw) ? raw : raw.split(",");
  const codes = values.map((v) => v.trim()).filter(Boolean);
  return codes.length ? [...new Set(codes)] : null;
}

function mapGroups(rows: CodeRow[]): types.CodeGroup[] {
  const groups = new Map<string, types.CodeGroup>();

  for (const row of rows) {
    let group = groups.get(row.groupCode);
    if (!group) {
      group = {
        id: row.groupId,
        groupCode: row.groupCode,
        groupName: row.groupName,
        description: row.groupDescription ?? undefined,
        useYn: row.groupUseYn,
        sortOrder: row.groupSortOrder,
        createdAt: row.groupCreatedAt,
        updatedAt: row.groupUpdatedAt,
        codes: [],
      };
      groups.set(row.groupCode, group);
    }

    if (row.id && row.code && row.name) {
      group.codes!.push({
        id: row.id,
        groupId: row.groupId,
        code: row.code,
        name: row.name,
        description: row.description ?? undefined,
        extra: row.extra ?? undefined,
        useYn: row.useYn ?? "Y",
        sortOrder: row.sortOrder ?? 0,
        createdAt: row.createdAt ?? row.groupCreatedAt,
        updatedAt: row.updatedAt ?? row.groupUpdatedAt,
      });
    }
  }

  return [...groups.values()];
}

const codeService = {
  async listCodeGroups(query: types.ListCodeGroupsQuery = {}) {
    const groupCodes = normalizeGroupCodes(query.groupCodes);
    const rows = await db.query<CodeRow>("code", "listCodes", {
      groupCodes: groupCodes ? utils.pgTextArr(groupCodes) : null,
      useYn: query.useYn ?? "Y",
    });
    return mapGroups(rows);
  },

  async getCodeGroup(groupCode: string, query: Pick<types.ListCodeGroupsQuery, "useYn"> = {}) {
    const rows = await db.query<CodeRow>("code", "getCodeGroup", {
      groupCode,
      useYn: query.useYn ?? "Y",
    });
    return mapGroups(rows)[0] ?? null;
  },
};

export default codeService;
