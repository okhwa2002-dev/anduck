"use client";

import { usePathname } from "next/navigation";
import useSWR from "swr";
import { menuApi } from "@/api/admin";

export function useMenuCode(): string | undefined {
  const pathname = usePathname();
  const { data: menus } = useSWR("admin-menus", () => menuApi.listForUser("WEB_ADMIN"));

  if (!menus) return undefined;

  const found = menus.find((m) => m.path && pathname.startsWith(m.path));
  return found?.menuCode;
}
