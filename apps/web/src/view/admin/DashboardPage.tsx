"use client";

import useSWR from "swr";
import { StatCard } from "@/components/admin/StatCard";
import { adminApi } from "@/api/admin";
import { useCommonCode } from "@/hooks/useCommonCodes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  REVIEWING: "검토중",
  CONFIRMED: "확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

export function DashboardPage() {
  const { data, error, isLoading } = useSWR("admin-dashboard", () =>
    adminApi.dashboard.summary(),
  );
  const statusCode = useCommonCode("RES_STATUS_CD");
  const statusLabel = { ...STATUS_LABEL, ...statusCode.labelMap };

  if (isLoading) return <p className="text-sm text-gray-400">로딩 중...</p>;
  if (error || !data)
    return <p className="text-sm text-red-500">데이터를 불러오지 못했습니다.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="오늘 예약" value={data.todayReservationCount} />
        <StatCard title="대기 예약" value={data.pendingReservationCount} />
        <StatCard title="운영 프로그램" value={data.activeProgramCount} />
        <StatCard title="운영 숙소" value={data.activeAccommodationCount} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-600">최근 예약</h2>
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>예약자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>접수일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentReservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.applicant.name}</TableCell>
                  <TableCell>{r.applicant.phone}</TableCell>
                  <TableCell>{statusLabel[r.status] ?? r.status}</TableCell>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
              {data.recentReservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    최근 예약이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
