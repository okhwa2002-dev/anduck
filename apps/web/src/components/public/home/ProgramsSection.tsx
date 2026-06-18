import Image from "next/image";
import Link from "next/link";
import type { Program } from "@anduck/types";

export function ProgramsSection({ programs }: { programs: Program[] }) {
  if (!programs.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">
          체험 프로그램
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 bg-gray-100">
                {program.mainImage?.url && (
                  <Image
                    src={program.mainImage.url}
                    alt={program.mainImage.alt ?? program.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{program.name}</h3>
                {program.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {program.summary}
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-green-700">
                  {program.pricePerPerson.toLocaleString()}원 / 인
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
