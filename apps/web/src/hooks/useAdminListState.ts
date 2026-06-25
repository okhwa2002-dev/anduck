"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterValues } from "@/components/common/FilterSelect";

interface UseAdminListStateOptions {
  basePath: string;
  pageSizeOptions: number[];
}

export interface AdminListState<TFilterField extends string> {
  router: ReturnType<typeof useRouter>;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  inputQ: string;
  setInputQ: (value: string) => void;
  q: string;
  filters: FilterValues<TFilterField>;
  handleFiltersChange: (next: FilterValues<TFilterField>) => void;
  handleSearch: () => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
}

export function useAdminListState<TFilterField extends string>({
  basePath,
  pageSizeOptions,
}: UseAdminListStateOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") || 1)));
  const [pageSize, setPageSize] = useState(() => {
    const ps = Number(searchParams.get("pageSize") || pageSizeOptions[0]);
    return pageSizeOptions.includes(ps) ? ps : pageSizeOptions[0];
  });
  const [inputQ, setInputQ] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterValues<TFilterField>>({});

  function updateUrl(nextPage: number, nextPageSize: number) {
    router.replace(`${basePath}?page=${nextPage}&pageSize=${nextPageSize}`, { scroll: false } as any);
  }

  function handleFiltersChange(next: FilterValues<TFilterField>) {
    setFilters(next);
    setPage(1);
    updateUrl(1, pageSize);
  }

  function handleSearch() {
    setQ(inputQ);
    setPage(1);
    updateUrl(1, pageSize);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    updateUrl(nextPage, pageSize);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
    updateUrl(1, nextPageSize);
  }

  return {
    router,
    page,
    pageSize,
    pageSizeOptions,
    inputQ,
    setInputQ,
    q,
    filters,
    handleFiltersChange,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  };
}
