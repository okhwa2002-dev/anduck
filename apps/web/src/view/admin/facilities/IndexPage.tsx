"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { type ColumnDef } from "@tanstack/react-table";
import { adminApi } from "@/api/admin";
import { downloadExcel } from "@/lib/download";
import { CodeBadge } from "@/components/common/CodeBadge";
import {
  TableGrid,
  buildFilterConditions,
  type FilterDefinition,
} from "@/components/common/TableGrid";
import { useAdminListState } from "@/hooks/useAdminListState";
import { useCommonCode } from "@/hooks/useCommonCodes";
import type { Facility } from "@anduck/types";

const FAC_TYPE_GROUP = "FAC_TYPE_CD";
const OPEN_YN_GROUP = "OPEN_YN";
const ACTIVE_YN_GROUP = "ACTIVE_YN";

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

function createColumns(
  kindLabel: Record<string, string>,
  openYnLabel: Record<string, string>,
  activeYnLabel: Record<string, string>,
): ColumnDef<Facility>[] {
  return [
  {
    accessorKey: "name",
    header: "시설명",
    meta: { align: "center" as const },
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    accessorKey: "kind",
    header: "구분",
    meta: { align: "center" as const },
    cell: ({ getValue }) => (
      <CodeBadge value={getValue<string>()} labels={kindLabel} />
    ),
  },
  {
    accessorKey: "summary",
    header: "요약",
    cell: ({ getValue }) => <span className="text-gray-500">{getValue<string>() ?? "-"}</span>,
  },
  {
    accessorKey: "mainOpenYn",
    header: "메인 노출",
    meta: { align: "center" as const },
    cell: ({ getValue }) => (
      <CodeBadge
        value={getValue<string>()}
        labels={openYnLabel}
        preset="openYn"
      />
    ),
  },
  {
    accessorKey: "activeYn",
    header: "활성",
    meta: { align: "center" as const },
    cell: ({ getValue }) => (
      <CodeBadge
        value={getValue<string>()}
        labels={activeYnLabel}
        preset="activeYn"
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "등록일",
    meta: { align: "center" as const },
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("ko-KR"),
  },
  ];
}

// ─── 필터 → FilterCondition 변환 ──────────────────────────────────────────────

type FacilityFilterField = "kind" | "mainOpenYn" | "activeYn";

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

export function FacilitiesIndexPage() {
  const list = useAdminListState<FacilityFilterField>({
    basePath: "/admin/facilities",
  });
  const facilityTypeCode = useCommonCode(FAC_TYPE_GROUP);
  const openYnCode = useCommonCode(OPEN_YN_GROUP);
  const activeYnCode = useCommonCode(ACTIVE_YN_GROUP);
  const columns = useMemo(
    () => createColumns(facilityTypeCode.labelMap, openYnCode.labelMap, activeYnCode.labelMap),
    [activeYnCode.labelMap, facilityTypeCode.labelMap, openYnCode.labelMap],
  );
  const filterDefinitions = useMemo<FilterDefinition<FacilityFilterField>[]>(
    () => [
      {
        label: "구분",
        field: "kind",
        options: facilityTypeCode.options,
      },
      {
        label: "메인노출",
        field: "mainOpenYn",
        options: openYnCode.options,
      },
      {
        label: "활성",
        field: "activeYn",
        options: activeYnCode.options,
      },
    ],
    [activeYnCode.options, facilityTypeCode.options, openYnCode.options],
  );

  const { data, error, isLoading } = useSWR(
    ["admin-facilities", list.page, list.pageSize, list.q, list.filters],
    () => adminApi.facilities.list({
      page: list.page,
      pageSize: list.pageSize,
      q: list.q || undefined,
      filters: buildFilterConditions(list.filters),
    }),
  );

  async function handleDownload() {
    const { data, filename } = await adminApi.facilities.export({
      q: list.q || undefined,
      filters: buildFilterConditions(list.filters),
    });
    downloadExcel(data, filename);
  }

  return (
    <TableGrid
      title="시설 관리"
      result={data}
      columns={columns}
      state={list}
      isLoading={isLoading}
      error={error}
      filters={filterDefinitions}
      searchPlaceholder="시설명 검색"
      createPath="/admin/facilities/new"
      onDownload={handleDownload}
      onRowClick={(row) => list.router.push(`/admin/facilities/${row.id}/edit`)}
    />
  );
}
