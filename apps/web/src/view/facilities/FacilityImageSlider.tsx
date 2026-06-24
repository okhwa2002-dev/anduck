"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Images } from "lucide-react";
import type { ImageRef } from "@anduck/types";

export function FacilityImageSlider({
  facilityName,
  images,
}: {
  facilityName: string;
  images: ImageRef[];
}) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const dots = useMemo(() => images.slice(0, 8), [images]);

  const goPrev = () => {
    setIndex((value) => (value === 0 ? images.length - 1 : value - 1));
  };

  const goNext = () => {
    setIndex((value) => (value === images.length - 1 ? 0 : value + 1));
  };

  return (
    <div className="bg-green-50 p-3">
      <div className="relative aspect-[16/10] overflow-hidden bg-green-100">
        {current?.url ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt ?? `${facilityName} 이미지 ${index + 1}`}
            fill
            unoptimized
            sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-green-700">
            <ImageIcon className="size-12" />
            <span className="text-sm font-semibold">이미지 준비중</span>
          </div>
        )}

        {hasImages && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
            <Images className="size-3.5" />
            {index + 1} / {images.length}
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={goPrev}
              className="absolute left-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={goNext}
              className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {hasMultiple ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {dots.map((image, dotIndex) => (
            <button
              key={image.id}
              type="button"
              aria-label={`${dotIndex + 1}번째 이미지 보기`}
              onClick={() => setIndex(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${
                dotIndex === index
                  ? "w-6 bg-green-700"
                  : "w-2.5 bg-green-200 hover:bg-green-400"
              }`}
            />
          ))}
          {images.length > dots.length && (
            <span className="text-xs font-medium text-gray-500">
              +{images.length - dots.length}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-3 h-6" aria-hidden="true" />
      )}
    </div>
  );
}
