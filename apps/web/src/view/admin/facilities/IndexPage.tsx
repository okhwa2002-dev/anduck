"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Search } from "lucide-react";
import { adminApi } from "@/api/admin";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Facility } from "@anduck/types";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const KIND_LABEL: Record<string, string> = {
  VILLAGE: "마을시설",
  NEARBY: "주변관광지",
};

const columns: ColumnDef<Facility>[] = [
  {
    accessorKey: "name",
    header: "시설명",
    meta: { align: "center" as const },
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "kind",
    header: "구분",
    meta: { align: "center" as const },
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
    meta: { align: "center" as const },
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
    meta: { align: "center" as const },
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
    meta: { align: "center" as const },
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleDateString("ko-KR"),
  },
];

function facilitiesToCsv(items: Facility[]): string {
  const header = ["시설명", "구분", "요약", "메인노출", "활성", "등록일"];
  const rows = items.map((f) => [
    f.name,
    KIND_LABEL[f.kind] ?? f.kind,
    f.summary ?? "",
    f.mainOpenYn === "Y" ? "노출" : "미노출",
    f.activeYn === "Y" ? "활성" : "비활성",
    new Date(f.createdAt).toLocaleDateString("ko-KR"),
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

export function FacilitiesIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") || 1)));
  const [pageSize, setPageSize] = useState(() => {
    const ps = Number(searchParams.get("pageSize") || PAGE_SIZE_OPTIONS[0]);
    return PAGE_SIZE_OPTIONS.includes(ps) ? ps : PAGE_SIZE_OPTIONS[0];
  });
  const [inputQ, setInputQ] = useState("");
  const [q, setQ] = useState("");

  function updateUrl(p: number, ps: number) {
    router.replace(`/admin/facilities?page=${p}&pageSize=${ps}`, { scroll: false } as any);
  }

  const { data, error, isLoading } = useSWR(
    ["admin-facilities", page, pageSize, q],
    () => adminApi.facilities.list({ page, pageSize, q: q || undefined }),
  );

  function handleSearch() {
    setQ(inputQ);
    setPage(1);
    updateUrl(1, pageSize);
  }

  async function handleDownload() {
    const all = await adminApi.facilities.list({ all: true, q: q || undefined });
    const csv = facilitiesToCsv(all.items);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "시설목록.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">시설 관리</h1>

      {/* 필터 + 버튼 바 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="시설명 검색"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-60"
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="size-3.5" />
            검색
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/admin/facilities/new")}>
            <Plus className="size-3.5" />
            추가
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-3.5" />
            다운로드
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage="등록된 시설이 없습니다."
          pagination={
            data
              ? {
                  page: data.page,
                  pageSize: data.pageSize,
                  total: data.total,
                  totalPages: data.totalPages,
                }
              : undefined
          }
          onRowClick={(row) => router.push(`/admin/facilities/${row.id}/edit`)}
          onPageChange={(p) => { setPage(p); updateUrl(p, pageSize); }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); updateUrl(1, ps); }}
        />
      </div>
    </div>
  );
}
