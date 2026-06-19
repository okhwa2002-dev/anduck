import type { Menu } from "@anduck/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function getPublicMenus(groupCode = "WEB_PUBLIC"): Promise<Menu[]> {
  try {
    const res = await fetch(
      `${API_URL}/menus?groupCode=${encodeURIComponent(groupCode)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    return res.json() as Promise<Menu[]>;
  } catch {
    return [];
  }
}
