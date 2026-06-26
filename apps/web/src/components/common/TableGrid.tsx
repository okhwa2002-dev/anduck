"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { FilterCondition } from "@anduck/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AdminListState } from "@/hooks/useAdminListState";

// ─── Filter ───────────────────────────────────────────────────────────────────

export type FilterMode = "single" | "multi";
export interface FilterOption { value: string; label: string }
export interface FilterDefinition<TField extends string = string> {
  label: string;
  field: TField;
  options: FilterOption[];
  mode?: FilterMode;
}
export type FilterValues<TField extends string = string> = Partial<Record<TField, string | string[]>>;

export function buildFilterConditions<TField extends string>(
  values: FilterValues<TField>,
): FilterCondition[] | undefined {
  const result = Object.entries(values).flatMap(([field, value]) => {
    if (Array.isArray(value)) return value.length ? [{ field, op: "in" as const, value }] : [];
    return value ? [{ field, op: "in" as const, value: [value] }] : [];
  });
  return result.length ? result : undefined;
}

function FilterSelect<TField extends string>({
  value,
  onChange,
  filters,
}: {
  value: FilterValues<TField>;
  onChange: (next: FilterValues<TField>) => void;
  filters: FilterDefinition<TField>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedCount = (Object.values(value) as Array<string | string[] | undefined>).reduce<number>(
    (sum, item) => (Array.isArray(item) ? sum + item.length : item ? sum + 1 : sum),
    0,
  );

  function toggle(definition: FilterDefinition<TField>, optionValue: string) {
    const field = definition.field;
    const current = value[field];
    if ((definition.mode ?? "multi") === "multi") {
      const currentValues = Array.isArray(current) ? current : current ? [current] : [];
      const nextValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange({ ...value, [field]: nextValues.length ? nextValues : undefined });
    } else {
      onChange({ ...value, [field]: current === optionValue ? undefined : optionValue });
    }
  }

  function isChecked(definition: FilterDefinition<TField>, optionValue: string) {
    const current = value[definition.field];
    return Array.isArray(current) ? current.includes(optionValue) : current === optionValue;
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} className="gap-1.5">
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
          <div className="space-y-3 p-3">
            {filters.map((definition) => (
              <div key={definition.field}>
                <p className="mb-1.5 text-xs font-semibold text-gray-500">{definition.label}</p>
                <ul className="space-y-1">
                  {definition.options.map((option) => (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50">
                        <input
                          type={(definition.mode ?? "multi") === "multi" ? "checkbox" : "radio"}
                          name={definition.field}
                          checked={isChecked(definition, option.value)}
                          onChange={() => toggle(definition, option.value)}
                          className="size-3.5 accent-primary"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {selectedCount > 0 && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={() => onChange({})}
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

// ─── DataTable ────────────────────────────────────────────────────────────────

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function DataTable<T extends object>({
  data,
  columns,
  isLoading,
  error,
  emptyMessage = "데이터가 없습니다.",
  pagination,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  onRowClick,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  if (isLoading) return <p className="p-6 text-center text-sm text-gray-400">로딩 중...</p>;
  if (error) return <p className="p-6 text-center text-sm text-red-500">데이터를 불러오지 못했습니다.</p>;

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none text-center"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" && " ↑"}
                  {header.column.getIsSorted() === "desc" && " ↓"}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={`hover:bg-gray-50${onRowClick ? " cursor-pointer" : ""}`}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => {
                const align = (
                  cell.column.columnDef.meta as { align?: "left" | "center" | "right" } | undefined
                )?.align;
                return (
                  <TableCell
                    key={cell.id}
                    className={
                      align === "center" ? "text-center" : align === "right" ? "text-right" : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-gray-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && onPageChange && (
        <div className="grid grid-cols-3 items-center border-t px-4 py-3">
          <div>
            {pageSizeOptions && onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>{n}건씩 보기</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center justify-center gap-1">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(1)}>«</Button>
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>‹</Button>
            <span className="px-3 text-sm">{pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>›</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.totalPages)}>»</Button>
          </div>
          <div className="text-right text-sm text-gray-500">
            전체 <span className="font-medium text-gray-800">{pagination.total}</span>건
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TableGrid ────────────────────────────────────────────────────────────────

type ListResult<TRow> = {
  items: TRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

interface TableGridProps<TRow extends object, TField extends string> {
  title: string;
  result?: ListResult<TRow>;
  columns: ColumnDef<TRow>[];
  state: AdminListState<TField>;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  filters?: FilterDefinition<TField>[];
  searchPlaceholder?: string;
  actions?: ReactNode;
  createPath?: string;
  createLabel?: string;
  onDownload?: () => void | Promise<void>;
  downloadLabel?: string;
  onRowClick?: (row: TRow) => void;
}

export function TableGrid<TRow extends object, TField extends string>({
  title,
  result,
  columns,
  state,
  isLoading,
  error,
  emptyMessage,
  filters,
  searchPlaceholder,
  actions,
  createPath,
  createLabel = "추가",
  onDownload,
  downloadLabel = "다운로드",
  onRowClick,
}: TableGridProps<TRow, TField>) {
  const hasActions = actions || createPath || onDownload;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {filters && (
            <FilterSelect value={state.filters} onChange={state.handleFiltersChange} filters={filters} />
          )}
          <Input
            placeholder={searchPlaceholder}
            value={state.inputQ}
            onChange={(e) => state.setInputQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && state.handleSearch()}
            className="w-56"
          />
          <Button variant="outline" size="sm" onClick={state.handleSearch}>
            <Search className="size-3.5" />
            검색
          </Button>
        </div>
        {hasActions && (
          <div className="flex items-center gap-2">
            {actions}
            {createPath && (
              <Button size="sm" onClick={() => state.router.push(createPath)}>
                <Plus className="size-3.5" />
                {createLabel}
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="size-3.5" />
                {downloadLabel}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white">
        <DataTable
          data={result?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          pagination={result}
          onPageChange={state.handlePageChange}
          pageSizeOptions={state.pageSizeOptions}
          onPageSizeChange={state.handlePageSizeChange}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
}
