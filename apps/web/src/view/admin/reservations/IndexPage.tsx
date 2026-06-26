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
import type { Reservation } from "@anduck/types";

const RES_TYPE_GROUP = "RES_TYPE_CD";
const RES_STATUS_GROUP = "RES_STATUS_CD";

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

function createColumns(
  kindLabel: Record<string, string>,
  statusLabel: Record<string, string>,
  statusClass: Record<string, string>,
): ColumnDef<Reservation>[] {
  return [
  {
    accessorKey: "kind",
    header: "구분",
    meta: { align: "center" as const },
    cell: ({ getValue }) => (
      <CodeBadge value={getValue<string>()} labels={kindLabel} />
    ),
  },
  {
    id: "applicantName",
    header: "예약자",
    meta: { align: "center" as const },
    cell: ({ row }) => <span className="font-medium">{row.original.applicant.name}</span>,
  },
  {
    id: "applicantPhone",
    header: "연락처",
    meta: { align: "center" as const },
    cell: ({ row }) => <span className="text-gray-600">{row.original.applicant.phone}</span>,
  },
  {
    id: "target",
    header: "예약 대상",
    cell: ({ row }) => {
      const { targetName, roomName } = row.original;
      return (
        <div>
          <span className="font-medium">{targetName}</span>
          {roomName && <span className="ml-1.5 text-xs text-gray-400">{roomName}</span>}
        </div>
      );
    },
  },
  {
    id: "period",
    header: "이용일",
    meta: { align: "center" as const },
    cell: ({ row }) => {
      const { startDate, endDate } = row.original;
      return (
        <span className="text-sm text-gray-600">
          {startDate}{endDate && endDate !== startDate ? ` ~ ${endDate}` : ""}
        </span>
      );
    },
  },
  {
    accessorKey: "guests",
    header: "인원",
    meta: { align: "center" as const },
    cell: ({ getValue }) => <span>{getValue<number>()}명</span>,
  },
  {
    accessorKey: "status",
    header: "상태",
    meta: { align: "center" as const },
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <CodeBadge
          value={status}
          labels={statusLabel}
          classNameByValue={statusClass}
          fallbackVariant="default"
        />
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "신청일",
    meta: { align: "center" as const },
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("ko-KR"),
  },
  ];
}

// ─── 필터 ─────────────────────────────────────────────────────────────────────

type ReservationFilterField = "kind" | "status";

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

export function ReservationsIndexPage() {
  const list = useAdminListState<ReservationFilterField>({
    basePath: "/admin/reservations",
  });

  const resTypeCode = useCommonCode(RES_TYPE_GROUP);
  const resStatusCode = useCommonCode(RES_STATUS_GROUP);
  const statusClass = resStatusCode.extraStringMap("badgeClass");
  const columns = useMemo(
    () => createColumns(resTypeCode.labelMap, resStatusCode.labelMap, statusClass),
    [resTypeCode.labelMap, resStatusCode.labelMap, statusClass],
  );
  const filterDefinitions = useMemo<FilterDefinition<ReservationFilterField>[]>(
    () => [
      {
        label: "구분",
        field: "kind",
        options: resTypeCode.options,
      },
      {
        label: "상태",
        field: "status",
        options: resStatusCode.options,
      },
    ],
    [resTypeCode.options, resStatusCode.options],
  );

  const { data, error, isLoading } = useSWR(
    ["admin-reservations", list.page, list.pageSize, list.q, list.filters],
    () =>
      adminApi.reservations.list({
        page: list.page,
        pageSize: list.pageSize,
        q: list.q || undefined,
        filters: buildFilterConditions(list.filters),
      }),
  );

  async function handleDownload() {
    const { data: excelData, filename } = await adminApi.reservations.export({
      q: list.q || undefined,
      filters: buildFilterConditions(list.filters),
    });
    downloadExcel(excelData, filename);
  }

  return (
    <TableGrid
      title="예약 관리"
      result={data}
      columns={columns}
      state={list}
      isLoading={isLoading}
      error={error}
      filters={filterDefinitions}
      searchPlaceholder="예약자명·연락처 검색"
      onDownload={handleDownload}
      onRowClick={(row) => list.router.push(`/admin/reservations/${row.id}`)}
    />
  );
}
