"use client";

import type { ReactNode } from "react";
import { Download, Plus, Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable";
import { FilterSelect, type FilterDefinition } from "@/components/common/FilterSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminListState } from "@/hooks/useAdminListState";

type ListResult<TRow> = {
  items: TRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

interface AdminListGridProps<TRow extends object, TField extends string> {
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

export function AdminListGrid<TRow extends object, TField extends string>({
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
}: AdminListGridProps<TRow, TField>) {
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
