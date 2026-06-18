import Image from "next/image";
import type { Banner } from "@anduck/types";

export function BannerSection({ banners }: { banners: Banner[] }) {
  const main = banners[0];
  if (!main) return null;

  return (
    <section className="relative h-[480px] w-full overflow-hidden bg-gray-200">
      {main.image?.url && (
        <Image
          src={main.image.url}
          alt={main.image.alt ?? main.title}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white">
        <h1 className="text-4xl font-bold drop-shadow">{main.title}</h1>
        {main.subtitle && (
          <p className="mt-3 text-lg drop-shadow">{main.subtitle}</p>
        )}
      </div>
    </section>
  );
}
