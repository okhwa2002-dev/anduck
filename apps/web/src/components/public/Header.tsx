import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "체험 프로그램", href: "/programs" },
  { label: "숙소", href: "/accommodations" },
  { label: "시설", href: "/facilities" },
  { label: "갤러리", href: "/gallery" },
  { label: "공지사항", href: "/notices" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-green-800">
          안덕 건강힐링체험마을
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 transition-colors hover:text-green-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          관리자
        </Link>
      </div>
    </header>
  );
}
