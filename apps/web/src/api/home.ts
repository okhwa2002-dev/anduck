import type { Accommodation, Banner, Facility, Notice, Program } from "@anduck/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export interface HomeData {
  banners: Banner[];
  featuredPrograms: Program[];
  featuredAccommodations: Accommodation[];
  latestNotices: Notice[];
  featuredFacilities: Facility[];
}

const emptyHomeData: HomeData = {
  banners: [],
  featuredPrograms: [],
  featuredAccommodations: [],
  latestNotices: [],
  featuredFacilities: [],
};

export async function getHomeData(): Promise<HomeData> {
  try {
    const res = await fetch(`${API_URL}/home`, { next: { revalidate: 300 } });
    if (!res.ok) return emptyHomeData;
    return res.json() as Promise<HomeData>;
  } catch {
    return emptyHomeData;
  }
}
