"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T extends object> {
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
}

export function DataTable<T extends object>({
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
}: DataTableProps<T>) {
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

  if (isLoading) {
    return <p className="p-6 text-center text-sm text-gray-400">로딩 중...</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-center text-sm text-red-500">
        데이터를 불러오지 못했습니다.
      </p>
    );
  }

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
                const align = (cell.column.columnDef.meta as unknown as { align?: "left" | "center" | "right" } | undefined)?.align;
                return (
                  <TableCell
                    key={cell.id}
                    className={
                      align === "center"
                        ? "text-center"
                        : align === "right"
                          ? "text-right"
                          : undefined
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
              <TableCell
                colSpan={columns.length}
                className="text-center text-gray-400"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && onPageChange && (
        <div className="grid grid-cols-3 items-center border-t px-4 py-3">
          {/* 좌: 페이지 사이즈 */}
          <div>
            {pageSizeOptions && onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}건씩 보기
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* 가운데: 페이징 버튼 */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(1)}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              ‹
            </Button>
            <span className="px-3 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.totalPages)}
            >
              »
            </Button>
          </div>
          {/* 우: 총 건수 */}
          <div className="text-right text-sm text-gray-500">
            전체 <span className="font-medium text-gray-800">{pagination.total}</span>건
          </div>
        </div>
      )}
    </div>
  );
}
