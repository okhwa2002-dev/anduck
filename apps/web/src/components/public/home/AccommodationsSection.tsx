import Image from "next/image";
import Link from "next/link";
import type { Accommodation } from "@anduck/types";

export function AccommodationsSection({
  accommodations,
}: {
  accommodations: Accommodation[];
}) {
  if (!accommodations.length) return null;

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">숙소</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {accommodations.map((acc) => (
            <Link
              key={acc.id}
              href={`/accommodations/${acc.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-52 bg-gray-100">
                {acc.mainImage?.url && (
                  <Image
                    src={acc.mainImage.url}
                    alt={acc.mainImage.alt ?? acc.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{acc.name}</h3>
                {acc.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {acc.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
