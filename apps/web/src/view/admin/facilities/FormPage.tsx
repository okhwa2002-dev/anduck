"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { adminApi } from "@/api/admin";
import { FacilityKind } from "@anduck/types";
import type { CreateFacilityInput } from "@anduck/types";
import { useCommonCode } from "@/hooks/useCommonCodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader, type UploadedImage } from "@/components/common/ImageUploader";
import { useMenuCode } from "@/hooks/useMenuCode";

interface Props {
  id?: string;
}

const KIND_OPTIONS = [
  { value: FacilityKind.VILLAGE, label: "마을시설" },
  { value: FacilityKind.NEARBY, label: "주변관광지" },
];

const OPEN_YN_OPTIONS = [
  { value: "N", label: "미노출" },
  { value: "Y", label: "노출" },
];

const ACTIVE_YN_OPTIONS = [
  { value: "Y", label: "활성" },
  { value: "N", label: "비활성" },
];

const SELECT_CLS =
  "w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300";

interface FormState {
  kind: FacilityKind;
  name: string;
  summary: string;
  description: string;
  addressZipCode: string;
  addressRoad: string;
  addressDetail: string;
  latitude: string;
  longitude: string;
  mainOpenYn: "Y" | "N";
  activeYn: "Y" | "N";
  sortOrder: string;
}

const EMPTY: FormState = {
  kind: FacilityKind.VILLAGE,
  name: "",
  summary: "",
  description: "",
  addressZipCode: "",
  addressRoad: "",
  addressDetail: "",
  latitude: "",
  longitude: "",
  mainOpenYn: "N",
  activeYn: "Y",
  sortOrder: "0",
};

export function FacilityFormPage({ id }: Props) {
  const router = useRouter();
  const isEdit = !!id;
  const menuCode = useMenuCode();
  const facilityTypeCode = useCommonCode("FAC_TYPE_CD");
  const openYnCode = useCommonCode("OPEN_YN");
  const activeYnCode = useCommonCode("ACTIVE_YN");
  const kindOptions = facilityTypeCode.options.length ? facilityTypeCode.options : KIND_OPTIONS;
  const openYnOptions = openYnCode.options.length ? openYnCode.options : OPEN_YN_OPTIONS;
  const activeYnOptions = activeYnCode.options.length ? activeYnCode.options : ACTIVE_YN_OPTIONS;

  const { data: facility, isLoading } = useSWR(
    id ? ["admin-facility", id] : null,
    () => adminApi.facilities.get(id!),
  );

  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageId, setMainImageId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility) return;
    setForm({
      kind: facility.kind,
      name: facility.name,
      summary: facility.summary ?? "",
      description: facility.description ?? "",
      addressZipCode: facility.address?.zipCode ?? "",
      addressRoad: facility.address?.road ?? "",
      addressDetail: facility.address?.detail ?? "",
      latitude: facility.location?.latitude?.toString() ?? "",
      longitude: facility.location?.longitude?.toString() ?? "",
      mainOpenYn: facility.mainOpenYn,
      activeYn: facility.activeYn,
      sortOrder: String(facility.sortOrder ?? 0),
    });
    setImages(
      (facility.images ?? []).map((img) => ({ id: img.id, url: img.url, filename: img.alt ?? "" })),
    );
    setMainImageId(facility.mainImage?.id);
  }, [facility]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: CreateFacilityInput = {
        kind: form.kind,
        name: form.name,
        summary: form.summary || undefined,
        description: form.description,
        address: form.addressRoad
          ? {
              road: form.addressRoad,
              detail: form.addressDetail || undefined,
              zipCode: form.addressZipCode || undefined,
            }
          : undefined,
        location:
          form.latitude && form.longitude
            ? {
                latitude: parseFloat(form.latitude),
                longitude: parseFloat(form.longitude),
              }
            : undefined,
        mainImageId: mainImageId,
        imageIds: images.map((img) => img.id),
        mainOpenYn: form.mainOpenYn,
        activeYn: form.activeYn,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };

      if (isEdit) {
        await adminApi.facilities.update(id, body);
        router.back();
      } else {
        await adminApi.facilities.create(body);
        router.push("/admin/facilities");
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setError(msg ?? "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && isLoading) {
    return <p className="p-6 text-center text-sm text-gray-400">로딩 중...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">
        {isEdit ? "시설 수정" : "시설 추가"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6">
        {/* 구분 / 정렬순서 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kind">구분 *</Label>
            <select
              id="kind"
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as FacilityKind)}
              className={SELECT_CLS}
              required
            >
              {kindOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">정렬순서</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </div>
        </div>

        {/* 시설명 */}
        <div className="space-y-1.5">
          <Label htmlFor="name">시설명 *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>

        {/* 요약 */}
        <div className="space-y-1.5">
          <Label htmlFor="summary">요약</Label>
          <Input
            id="summary"
            placeholder="한 줄 소개"
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </div>

        {/* 설명 */}
        <div className="space-y-1.5">
          <Label htmlFor="description">설명 *</Label>
          <textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            required
          />
        </div>

        {/* 이미지 */}
        <div className="space-y-1.5">
          <Label>이미지</Label>
          <p className="text-xs text-gray-400">
            첫 번째 이미지는 자동으로 대표 이미지가 됩니다. 다른 이미지를 대표로 사용하려면 썸네일 아래의 대표로 지정을 선택하세요.
          </p>
          <ImageUploader
            value={images}
            mainImageId={mainImageId}
            onChange={(next, nextMain) => { setImages(next); setMainImageId(nextMain); }}
            source={menuCode}
          />
        </div>

        {/* 주소 */}
        <div className="space-y-2">
          <Label>주소</Label>
          <div className="w-40">
            <Input
              placeholder="우편번호"
              value={form.addressZipCode}
              onChange={(e) => set("addressZipCode", e.target.value)}
            />
          </div>
          <Input
            placeholder="도로명 주소"
            value={form.addressRoad}
            onChange={(e) => set("addressRoad", e.target.value)}
          />
          <Input
            placeholder="상세 주소"
            value={form.addressDetail}
            onChange={(e) => set("addressDetail", e.target.value)}
          />
        </div>

        {/* 위치 */}
        <div className="space-y-1.5">
          <Label>위치 (위도 / 경도)</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              placeholder="위도 (예: 37.5665)"
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
            />
            <Input
              type="number"
              step="any"
              placeholder="경도 (예: 126.9780)"
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </div>
        </div>

        {/* 메인 노출 / 활성 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mainOpenYn">메인 노출</Label>
            <select
              id="mainOpenYn"
              value={form.mainOpenYn}
              onChange={(e) => set("mainOpenYn", e.target.value as "Y" | "N")}
              className={SELECT_CLS}
            >
              {openYnOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activeYn">활성</Label>
            <select
              id="activeYn"
              value={form.activeYn}
              onChange={(e) => set("activeYn", e.target.value as "Y" | "N")}
              className={SELECT_CLS}
            >
              {activeYnOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
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
      </form>
    </div>
  );
}
