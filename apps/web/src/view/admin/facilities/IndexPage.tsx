"use client";

import useSWR from "swr";
import { type ColumnDef } from "@tanstack/react-table";
import { adminApi } from "@/api/admin";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";
import type { Facility } from "@anduck/types";

const KIND_LABEL: Record<string, string> = {
  VILLAGE: "마을시설",
  NEARBY: "주변관광지",
};

const columns: ColumnDef<Facility>[] = [
  {
    accessorKey: "name",
    header: "시설명",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "kind",
    header: "구분",
    cell: ({ getValue }) => (
      <Badge variant="outline">
        {KIND_LABEL[getValue<string>()] ?? getValue<string>()}
      </Badge>
    ),
  },
  {
    accessorKey: "summary",
    header: "요약",
    cell: ({ getValue }) => (
      <span className="text-gray-500">{getValue<string>() ?? "-"}</span>
    ),
  },
  {
    accessorKey: "mainOpenYn",
    header: "메인 노출",
    cell: ({ getValue }) =>
      getValue<string>() === "Y" ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">노출</Badge>
      ) : (
        <Badge variant="outline" className="text-gray-400">미노출</Badge>
      ),
  },
  {
    accessorKey: "activeYn",
    header: "활성",
    cell: ({ getValue }) =>
      getValue<string>() === "Y" ? (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">활성</Badge>
      ) : (
        <Badge variant="outline" className="text-gray-400">비활성</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "등록일",
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleDateString("ko-KR"),
  },
];

export function FacilitiesIndexPage() {
  const { data, error, isLoading } = useSWR("admin-facilities", () =>
    adminApi.facilities.list({ pageSize: 100 }),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">시설 관리</h1>
        <span className="text-sm text-gray-400">총 {data?.total ?? 0}건</span>
      </div>
      <div className="rounded-lg border bg-white">
        <AdminTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="등록된 시설이 없습니다."
        />
      </div>
    </div>
  );
}
