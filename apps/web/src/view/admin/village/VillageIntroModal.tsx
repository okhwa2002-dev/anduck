"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader, type UploadedImage } from "@/components/common/ImageUploader";
import { adminApi } from "@/api/admin";
import { useCommonCode } from "@/hooks/useCommonCodes";
import type { VillageProfile } from "@anduck/types";

const OPEN_YN_GROUP = "OPEN_YN";

interface Props {
  item?: VillageProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export function VillageIntroModal({ item, onClose, onSuccess }: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [openYn, setOpenYn] = useState<"Y" | "N">(item?.openYn ?? "Y");
  const [images, setImages] = useState<UploadedImage[]>(
    () => (item?.images ?? []).map((img) => ({ id: img.id, url: img.url, filename: img.alt ?? "" })),
  );
  const [mainImageId, setMainImageId] = useState<string | undefined>(item?.images?.[0]?.id);
  const [loading, setLoading] = useState(false);
  const openYnCode = useCommonCode(OPEN_YN_GROUP);

  useEffect(() => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setOpenYn(item?.openYn ?? "Y");
    const imgs = (item?.images ?? []).map((img) => ({ id: img.id, url: img.url, filename: img.alt ?? "" }));
    setImages(imgs);
    setMainImageId(imgs[0]?.id);
  }, [item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const imageIds = images.map((img) => img.id);
      if (item) {
        await adminApi.village.intros.update(item.id, {
          title: name,
          body: description || undefined,
          imageIds,
          openYn,
        });
      } else {
        await adminApi.village.intros.create({
          title: name,
          body: description || undefined,
          imageIds,
          openYn,
        });
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "마을소개 수정" : "마을소개 등록"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vi-name">제목</Label>
            <Input
              id="vi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="소개 제목을 입력하세요"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vi-desc">본문</Label>
            <Textarea
              id="vi-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="소개 내용을 입력하세요"
              rows={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vi-open">공개여부</Label>
            <select
              id="vi-open"
              value={openYn}
              onChange={(e) => setOpenYn(e.target.value as "Y" | "N")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {openYnCode.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>이미지</Label>
            <ImageUploader
              value={images}
              mainImageId={mainImageId}
              onChange={(imgs, main) => { setImages(imgs); setMainImageId(main); }}
              source="village"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
