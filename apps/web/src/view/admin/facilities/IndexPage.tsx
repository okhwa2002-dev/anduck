"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { adminApi } from "@/api/admin";
import { downloadExcel } from "@/lib/download";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Facility, FilterCondition } from "@anduck/types";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const KIND_LABEL: Record<string, string> = {
  VILLAGE: "마을시설",
  NEARBY: "주변관광지",
};

// ─── 멀티필터 옵션 정의 ────────────────────────────────────────────────────────

interface FilterOption {
  group: string;
  field: "kind" | "mainOpenYn" | "activeYn";
  value: string;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { group: "구분",    field: "kind",       value: "VILLAGE", label: "마을시설" },
  { group: "구분",    field: "kind",       value: "NEARBY",  label: "주변관광지" },
  { group: "메인노출", field: "mainOpenYn", value: "Y",       label: "노출" },
  { group: "메인노출", field: "mainOpenYn", value: "N",       label: "미노출" },
  { group: "활성",    field: "activeYn",   value: "Y",       label: "활성" },
  { group: "활성",    field: "activeYn",   value: "N",       label: "비활성" },
];

const FILTER_GROUPS = [...new Set(FILTER_OPTIONS.map((o) => o.group))];

// ─── 컬럼 정의 ────────────────────────────────────────────────────────────────

const columns: ColumnDef<Facility>[] = [
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
      <Badge variant="outline">{KIND_LABEL[getValue<string>()] ?? getValue<string>()}</Badge>
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
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString("ko-KR"),
  },
];

// ─── 필터 → FilterCondition 변환 ──────────────────────────────────────────────

type ActiveFilters = Partial<Record<FilterOption["field"], string[]>>;

function buildFilterConditions(f: ActiveFilters): FilterCondition[] | undefined {
  const result: FilterCondition[] = [];
  if (f.kind?.length) result.push({ field: "kind", op: "in", value: f.kind });
  if (f.mainOpenYn?.length) result.push({ field: "mainOpenYn", op: "in", value: f.mainOpenYn });
  if (f.activeYn?.length) result.push({ field: "activeYn", op: "in", value: f.activeYn });
  return result.length ? result : undefined;
}

// ─── 멀티셀렉트 컴포넌트 ──────────────────────────────────────────────────────

interface FilterSelectProps {
  value: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
}

function FacilityFilterSelect({ value, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedCount = Object.values(value).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

  function toggle(field: FilterOption["field"], val: string) {
    const current = value[field] ?? [];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onChange({ ...value, [field]: next.length ? next : undefined });
  }

  function reset() {
    onChange({});
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-1.5"
      >
        <SlidersHorizontal className="size-3.5" />
        필터
        {selectedCount > 0 && (
          <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-md border bg-white shadow-md">
          <div className="p-3 space-y-3">
            {FILTER_GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-1.5 text-xs font-semibold text-gray-500">{group}</p>
                <ul className="space-y-1">
                  {FILTER_OPTIONS.filter((o) => o.group === group).map((opt) => {
                    const checked = value[opt.field]?.includes(opt.value) ?? false;
                    return (
                      <li key={opt.value}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(opt.field, opt.value)}
                            className="size-3.5 accent-primary"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {selectedCount > 0 && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={reset}
                className="w-full text-xs text-gray-400 hover:text-gray-700"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

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
  const [filters, setFilters] = useState<ActiveFilters>({});

  function updateUrl(p: number, ps: number) {
    router.replace(`/admin/facilities?page=${p}&pageSize=${ps}`, { scroll: false } as any);
  }

  function handleFiltersChange(next: ActiveFilters) {
    setFilters(next);
    setPage(1);
    updateUrl(1, pageSize);
  }

  const { data, error, isLoading } = useSWR(
    ["admin-facilities", page, pageSize, q, filters],
    () => adminApi.facilities.list({ page, pageSize, q: q || undefined, filters: buildFilterConditions(filters) }),
  );

  function handleSearch() {
    setQ(inputQ);
    setPage(1);
    updateUrl(1, pageSize);
  }

  async function handleDownload() {
    const { data, filename } = await adminApi.facilities.export({ q: q || undefined, filters: buildFilterConditions(filters) });
    downloadExcel(data, filename);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">시설 관리</h1>

      {/* 검색 + 필터 + 버튼 바 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FacilityFilterSelect value={filters} onChange={handleFiltersChange} />
          <Input
            placeholder="시설명 검색"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-52"
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
