"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { menuApi } from "@/api/admin";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: menus } = useSWR("admin-menus", () =>
    menuApi.listForUser("WEB_ADMIN"),
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-4">
        <span className="font-bold text-green-800">안덕 관리자</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {menus?.map((menu) => (
          <Link
            key={menu.id}
            href={menu.path ?? "#"}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
              pathname === menu.path
                ? "bg-green-50 font-medium text-green-800"
                : "text-gray-600"
            }`}
          >
            {menu.menuName}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t p-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => router.push("/")}
        >
          <ExternalLink className="size-3.5" />
          공개사이트
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
