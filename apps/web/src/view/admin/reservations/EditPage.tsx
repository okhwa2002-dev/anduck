"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { adminApi } from "@/api/admin";
import { ReservationStatus } from "@anduck/types";
import { CodeBadge } from "@/components/common/CodeBadge";
import { useCommonCode } from "@/hooks/useCommonCodes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SELECT_CLS =
  "w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300";

interface FormState {
  status: ReservationStatus;
  adminMemo: string;
}

interface Props {
  id: string;
}

export function ReservationEditPage({ id }: Props) {
  const router = useRouter();
  const resTypeCode = useCommonCode("RES_TYPE_CD");
  const resStatusCode = useCommonCode("RES_STATUS_CD");
  const statusClass = resStatusCode.extraStringMap("badgeClass");

  const { data: reservation, isLoading, error } = useSWR(
    ["admin-reservation", id],
    () => adminApi.reservations.get(id),
  );

  const [form, setForm] = useState<FormState>({ status: ReservationStatus.PENDING, adminMemo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservation) return;
    setForm({
      status: reservation.status as ReservationStatus,
      adminMemo: reservation.adminMemo ?? "",
    });
  }, [reservation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.reservations.updateStatus(id, {
        status: form.status,
        adminMemo: form.adminMemo || undefined,
      });
      router.push("/admin/reservations");
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setSubmitError(msg ?? "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <p className="p-6 text-center text-sm text-gray-400">로딩 중...</p>;
  if (error || !reservation) return <p className="p-6 text-center text-sm text-red-500">예약 정보를 불러오지 못했습니다.</p>;

  const { applicant, kind, status, targetName, roomName, startDate, endDate, guests, requestMemo, createdAt } = reservation;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">예약 수정</h1>

      {/* 예약 정보 (읽기 전용) */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">예약 정보</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-400">구분</dt>
            <dd className="mt-1">
              <CodeBadge value={kind} labels={resTypeCode.labelMap} />
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">현재 상태</dt>
            <dd className="mt-1">
              <CodeBadge
                value={status}
                labels={resStatusCode.labelMap}
                classNameByValue={statusClass}
                fallbackVariant="default"
              />
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">예약자</dt>
            <dd className="mt-1 font-medium">{applicant.name}</dd>
          </div>
          <div>
            <dt className="text-gray-400">연락처</dt>
            <dd className="mt-1">{applicant.phone}</dd>
          </div>
          {applicant.email && (
            <div>
              <dt className="text-gray-400">이메일</dt>
              <dd className="mt-1">{applicant.email}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400">예약 대상</dt>
            <dd className="mt-1">
              {targetName}
              {roomName && <span className="ml-1.5 text-xs text-gray-400">{roomName}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">이용일</dt>
            <dd className="mt-1">
              {startDate}{endDate && endDate !== startDate ? ` ~ ${endDate}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">인원</dt>
            <dd className="mt-1">{guests}명</dd>
          </div>
          <div>
            <dt className="text-gray-400">신청일</dt>
            <dd className="mt-1">{new Date(createdAt).toLocaleDateString("ko-KR")}</dd>
          </div>
          {requestMemo && (
            <div className="col-span-2">
              <dt className="text-gray-400">신청 메모</dt>
              <dd className="mt-1 whitespace-pre-line text-gray-700">{requestMemo}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 처리 (수정 가능) */}
      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">처리</h2>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="status">상태 *</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReservationStatus }))}
              className={SELECT_CLS}
              required
            >
              {resStatusCode.options.length > 0
                ? resStatusCode.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))
                : Object.values(ReservationStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminMemo">관리자 메모</Label>
            <textarea
              id="adminMemo"
              rows={4}
              value={form.adminMemo}
              onChange={(e) => setForm((f) => ({ ...f, adminMemo: e.target.value }))}
              placeholder="관리자 메모를 입력하세요"
              className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <div className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/reservations")}>
              목록
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
