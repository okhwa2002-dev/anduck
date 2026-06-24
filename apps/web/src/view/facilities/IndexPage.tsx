import { MapPin } from "lucide-react";
import {
  FacilityKind,
  type Facility,
  type ImageRef,
  type Menu,
  type Paginated,
} from "@anduck/types";
import { findMenuByCode } from "@/api/menu";
import { FacilityImageSlider } from "./FacilityImageSlider";

const FALLBACK_TITLE: Record<FacilityKind, string> = {
  [FacilityKind.VILLAGE]: "마을시설",
  [FacilityKind.NEARBY]: "주변관광지",
};

export function FacilitiesPage({
  data,
  kind,
  menus = [],
}: {
  data: Paginated<Facility>;
  kind: FacilityKind;
  menus?: Menu[];
}) {
  const activeMenu = findMenuByCode(
    menus,
    kind === FacilityKind.VILLAGE ? "ENJOY_FACILITIES" : "ENJOY_TOURISM",
  );
  const title = activeMenu?.menuName ?? FALLBACK_TITLE[kind];

  return (
    <div className="bg-white">
      <section className="border-b border-gray-200 bg-white px-6 py-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {data.items.length > 0 ? (
          <div className="flex flex-col gap-8">
            {data.items.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-gray-500">
              등록된 시설 정보가 없습니다.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  const images = getFacilityImages(facility);
  const address = [facility.address?.road, facility.address?.detail]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="grid overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.05fr)]">
      <FacilityImageSlider facilityName={facility.name} images={images} />

      <div className="flex min-h-[360px] flex-col p-7">
        <h2 className="text-2xl font-bold leading-8 text-gray-900">
          {facility.name}
        </h2>
        {facility.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">
            {facility.description}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-8">
          {address && (
            <p className="flex items-start gap-2 text-sm leading-5 text-gray-500">
              <MapPin className="mt-0.5 size-4 shrink-0 text-green-700" />
              <span>{address}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function getFacilityImages(facility: Facility): ImageRef[] {
  const seen = new Set<string>();
  const images = [facility.mainImage, ...facility.images].filter(
    (image): image is ImageRef => Boolean(image?.url),
  );

  return images.filter((image) => {
    if (seen.has(image.id)) return false;
    seen.add(image.id);
    return true;
  });
}
