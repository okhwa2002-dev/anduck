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

export function findMenuByCode(menus: Menu[], menuCode: string): Menu | undefined {
  for (const menu of menus) {
    if (menu.menuCode === menuCode) return menu;

    const child = findMenuByCode(menu.children ?? [], menuCode);
    if (child) return child;
  }

  return undefined;
}
