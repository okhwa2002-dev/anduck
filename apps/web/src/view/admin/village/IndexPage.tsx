"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { CodeBadge } from "@/components/common/CodeBadge";
import {
  TableGrid,
  buildFilterConditions,
  type FilterDefinition,
} from "@/components/common/TableGrid";
import { useAdminListState } from "@/hooks/useAdminListState";
import { useCommonCode } from "@/hooks/useCommonCodes";
import { VillageIntroModal } from "./VillageIntroModal";
import type { VillageProfile } from "@anduck/types";

const OPEN_YN_GROUP = "OPEN_YN";

type VillageIntroFilterField = "openYn";

function createColumns(openYnLabel: Record<string, string>): ColumnDef<VillageProfile>[] {
  return [
    {
      accessorKey: "name",
      header: "제목",
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: "openYn",
      header: "공개",
      meta: { align: "center" as const },
      cell: ({ getValue }) => (
        <CodeBadge value={getValue<string>()} labels={openYnLabel} preset="openYn" />
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

export function VillageIndexPage() {
  const list = useAdminListState<VillageIntroFilterField>({
    basePath: "/admin/village",
  });
  const [modal, setModal] = useState<{ open: boolean; item?: VillageProfile }>({
    open: false,
  });

  const openYnCode = useCommonCode(OPEN_YN_GROUP);
  const columns = useMemo(
    () => createColumns(openYnCode.labelMap),
    [openYnCode.labelMap],
  );
  const filterDefinitions = useMemo<FilterDefinition<VillageIntroFilterField>[]>(
    () => [{ label: "공개", field: "openYn", options: openYnCode.options }],
    [openYnCode.options],
  );

  const { data, error, isLoading, mutate } = useSWR(
    ["admin-village-intros", list.page, list.pageSize, list.q, list.filters],
    () =>
      adminApi.village.intros.list({
        page: list.page,
        pageSize: list.pageSize,
        q: list.q || undefined,
        filters: buildFilterConditions(list.filters),
      }),
  );

  function handleSuccess() {
    setModal({ open: false });
    mutate();
  }

  return (
    <>
      <TableGrid
        title="마을소개 관리"
        result={data}
        columns={columns}
        state={list}
        isLoading={isLoading}
        error={error}
        filters={filterDefinitions}
        searchPlaceholder="제목 검색"
        actions={
          <Button size="sm" onClick={() => setModal({ open: true })}>
            <Plus className="size-3.5" />
            추가
          </Button>
        }
        onRowClick={(row) => setModal({ open: true, item: row })}
      />
      {modal.open && (
        <VillageIntroModal
          item={modal.item}
          onClose={() => setModal({ open: false })}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
