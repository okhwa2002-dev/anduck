import type { Facility, FacilityKind, Paginated } from "@anduck/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const emptyFacilities: Paginated<Facility> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 100,
  totalPages: 0,
};

export async function getFacilities(kind?: FacilityKind): Promise<Paginated<Facility>> {
  const params = new URLSearchParams({
    pageSize: "100",
  });
  if (kind) params.set("kind", kind);

  try {
    const res = await fetch(`${API_URL}/facilities?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return emptyFacilities;
    return res.json() as Promise<Paginated<Facility>>;
  } catch {
    return emptyFacilities;
  }
}
