import Image from "next/image";
import type { Banner } from "@anduck/types";

export function BannerSection({ banners }: { banners: Banner[] }) {
  const main = banners[0];
  if (!main) return null;

  const hasImage = Boolean(main.image?.url);

  return (
    <section className="relative h-[480px] w-full overflow-hidden bg-green-800">
      {hasImage ? (
        <Image
          src={main.image!.url}
          alt={main.image.alt ?? main.title}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#24552a_0%,#5f972f_55%,#f3f7ed_100%)]" />
      )}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white ${
          hasImage ? "bg-black/35" : "bg-black/15"
        }`}
      >
        <h1 className="max-w-4xl text-4xl font-bold leading-tight drop-shadow md:text-5xl">
          {main.title}
        </h1>
        {main.subtitle && (
          <p className="mt-4 max-w-2xl text-lg leading-7 drop-shadow md:text-xl">
            {main.subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
