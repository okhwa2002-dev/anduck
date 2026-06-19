import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getPublicMenus } from "@/api/menu";
import type { Menu } from "@anduck/types";

export async function Header() {
  const menus = await getPublicMenus();
  const navItems = menus.filter((m) => m.menuCode !== "HOME");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-green-800">
          안덕 건강힐링체험마을
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) =>
            item.children?.length ? (
              <NavDropdown key={item.id} item={item} />
            ) : item.path ? (
              <Link
                key={item.id}
                href={item.path}
                target={item.target === "_blank" ? "_blank" : undefined}
                className="text-sm text-gray-600 transition-colors hover:text-green-800"
              >
                {item.menuName}
              </Link>
            ) : null,
          )}
        </nav>
        <Link
          href="/admin"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          관리자
        </Link>
      </div>
    </header>
  );
}

function NavDropdown({ item }: { item: Menu }) {
  return (
    <div className="group relative">
      <span className="cursor-default text-sm text-gray-600 transition-colors group-hover:text-green-800">
        {item.menuName}
      </span>
      <div className="absolute left-0 top-full z-50 hidden min-w-36 rounded-lg border bg-white py-1 shadow-md group-hover:block">
        {item.children!.map((child) =>
          child.path ? (
            <Link
              key={child.id}
              href={child.path}
              target={child.target === "_blank" ? "_blank" : undefined}
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-800"
            >
              {child.menuName}
            </Link>
          ) : null,
        )}
      </div>
    </div>
  );
}
