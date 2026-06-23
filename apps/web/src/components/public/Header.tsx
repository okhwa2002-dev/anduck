import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getPublicMenus } from "@/api/menu";
import type { Menu } from "@anduck/types";

export async function Header() {
  const menus = await getPublicMenus();
  const navItems = menus.filter((m) => m.menuCode !== "HOME");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4">
        {/* 메인 바 */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold text-green-800">
            안덕 건강힐링체험마을
          </Link>

          {/* 네비게이션 + 메가 드롭다운 */}
          <div className="group relative hidden items-center gap-12 md:flex">
            {navItems.map((item) =>
              item.path ? (
                <Link
                  key={item.id}
                  href={item.path}
                  target={item.target === "_blank" ? "_blank" : undefined}
                  className="text-sm text-gray-600 transition-colors hover:text-green-800"
                >
                  {item.menuName}
                </Link>
              ) : (
                <span
                  key={item.id}
                  className="cursor-default text-sm text-gray-600 transition-colors group-hover:text-green-800"
                >
                  {item.menuName}
                </span>
              ),
            )}

            {/* 메가 패널 — nav에 hover 시 전체 표시 */}
            <MegaPanel items={navItems} />
          </div>

          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            관리자
          </Link>
        </div>
      </div>
    </header>
  );
}

function MegaPanel({ items }: { items: Menu[] }) {
  const withChildren = items.filter((m) => m.children?.length);
  if (!withChildren.length) return null;

  return (
    <div className="absolute left-0 top-full hidden w-full group-hover:flex">
      {/* 빈 공간 브릿지 — hover 끊김 방지 */}
      <div className="absolute -top-2 left-0 h-2 w-full" />
      <div className="flex w-full justify-between rounded-xl border bg-white px-0 py-5 shadow-lg">
        {withChildren.map((item) => (
          <div key={item.id} className="min-w-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-800">
              {item.menuName}
            </p>
            <ul className="space-y-1">
              {item.children!.map((child) =>
                child.path ? (
                  <li key={child.id}>
                    <Link
                      href={child.path}
                      target={child.target === "_blank" ? "_blank" : undefined}
                      className="block text-sm text-gray-600 hover:text-green-800"
                    >
                      {child.menuName}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
