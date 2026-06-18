"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "대시보드", href: "/admin" },
  { label: "프로그램", href: "/admin/programs" },
  { label: "숙소", href: "/admin/accommodations" },
  { label: "예약", href: "/admin/reservations" },
  { label: "공지사항", href: "/admin/notices" },
  { label: "갤러리", href: "/admin/gallery" },
  { label: "시설", href: "/admin/facilities" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
              pathname === item.href
                ? "bg-green-50 font-medium text-green-800"
                : "text-gray-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
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
