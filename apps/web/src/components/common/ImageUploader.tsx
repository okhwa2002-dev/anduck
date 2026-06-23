"use client";

import { useRef, useState } from "react";
import { Star, Upload, X } from "lucide-react";
import { filesApi } from "@/api/files";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
}

interface Props {
  value: UploadedImage[];
  mainImageId?: string;
  onChange: (images: UploadedImage[], mainImageId?: string) => void;
  source?: string;
}

export function ImageUploader({ value, mainImageId, onChange, source }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const results: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const uploaded = await filesApi.uploadImage(fd, source);
        results.push({ id: uploaded.id, url: uploaded.url, filename: uploaded.filename });
      }
      const next = [...value, ...results];
      const nextMain = mainImageId ?? results[0]?.id;
      onChange(next, nextMain);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    const next = value.filter((img) => img.id !== id);
    const nextMain = mainImageId === id ? (next[0]?.id ?? undefined) : mainImageId;
    onChange(next, nextMain);
  }

  function setMain(id: string) {
    onChange(value, id);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {value.map((img) => {
            const isMain = img.id === mainImageId;
            return (
              <div
                key={img.id}
                className={cn(
                  "group relative overflow-hidden rounded-md border-2",
                  isMain ? "border-primary" : "border-gray-200",
                )}
              >
                <img
                  src={img.url}
                  alt={img.filename}
                  className="aspect-square w-full object-cover"
                />
                {isMain && (
                  <span className="absolute left-1 top-1 rounded bg-primary px-1 py-0.5 text-[10px] font-semibold text-white">
                    대표
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isMain && (
                    <button
                      type="button"
                      onClick={() => setMain(img.id)}
                      title="대표 이미지로 설정"
                      className="rounded bg-white/90 p-1 hover:bg-white"
                    >
                      <Star className="size-3.5 text-yellow-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    title="삭제"
                    className="rounded bg-white/90 p-1 hover:bg-white"
                  >
                    <X className="size-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        <Upload className="size-4" />
        {uploading ? "업로드 중..." : "이미지 추가"}
      </button>
    </div>
  );
}
