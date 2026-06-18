import type { Accommodation, Banner, Facility, Notice, Program } from "@anduck/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export interface HomeData {
  banners: Banner[];
  featuredPrograms: Program[];
  featuredAccommodations: Accommodation[];
  latestNotices: Notice[];
  featuredFacilities: Facility[];
}

export async function getHomeData(): Promise<HomeData> {
  const res = await fetch(`${API_URL}/home`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("홈 데이터 로드 실패");
  return res.json() as Promise<HomeData>;
}
