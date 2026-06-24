"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import type { Menu } from "@anduck/types";

const BRAND = "안덕 건강힐링체험마을";

export function PublicHeaderClient({ menus }: { menus: Menu[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const navItems = useMemo(
    () => menus.filter((m) => m.menuCode !== "HOME"),
    [menus],
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full bg-white"
        onMouseLeave={() => setDesktopOpen(false)}
      >
        <div className="border-b border-green-900/10 bg-white lg:hidden">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                안
              </span>
              <span className="truncate text-base font-bold text-green-900">
                {BRAND}
              </span>
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex size-10 items-center justify-center rounded-md border border-green-900/15 text-green-900 transition-colors hover:bg-green-50"
            >
              {mobileOpen ? <X className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </div>

        <div
          className="hidden bg-white px-[30px] lg:block"
          onMouseEnter={() => setDesktopOpen(true)}
          onFocus={() => setDesktopOpen(true)}
        >
          <div className="flex h-[54px] items-center justify-between bg-white">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-base font-bold text-white">
                안
              </span>
              <span className="truncate text-lg font-bold text-green-900">
                {BRAND}
              </span>
            </Link>

            <nav className="flex items-center text-xs font-semibold text-gray-600">
              <Link href="/" className="transition-colors hover:text-green-800">
                HOME
              </Link>
              <span className="mx-3 text-gray-300">|</span>
              <Link href="/mypage" className="transition-colors hover:text-green-800">
                MYPAGE
              </Link>
              <span className="mx-3 text-gray-300">|</span>
              <Link href="/admin" className="transition-colors hover:text-green-800">
                관리자
              </Link>
            </nav>
          </div>

          <nav
            className="grid h-[60px] bg-[#4b4738] text-white shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${Math.max(navItems.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {navItems.map((item) => (
              <TopMenuItem key={item.id} item={item} />
            ))}
          </nav>
        </div>

        <DesktopMegaMenu
          open={desktopOpen}
          items={navItems}
          onClose={() => setDesktopOpen(false)}
        />
      </header>

      <MobileFullMenu
        open={mobileOpen}
        items={navItems}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}

function TopMenuItem({ item }: { item: Menu }) {
  const content = (
    <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
      {item.menuName}
      <ChevronDown className="size-4 opacity-80" />
    </span>
  );

  if (!item.path) {
    return (
      <div className="flex items-center justify-center px-4 text-center">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.path}
      target={item.target === "_blank" ? "_blank" : undefined}
      className="flex items-center justify-center px-4 text-center transition-colors hover:bg-white/5"
    >
      {content}
    </Link>
  );
}

function DesktopMegaMenu({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: Menu[];
  onClose: () => void;
}) {
  return (
    <div
      className={`absolute left-0 top-[114px] hidden w-full bg-white px-[30px] transition lg:block ${
        open
          ? "pointer-events-auto border-b border-gray-200 opacity-100 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
          : "pointer-events-none border-b-0 opacity-0 shadow-none"
      }`}
      onMouseEnter={() => undefined}
      aria-hidden={!open}
    >
      <nav
        className="grid min-h-[104px] bg-white"
        style={{
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center border-l border-gray-200 px-6 py-7 text-center first:border-l-0"
          >
            <ul className="space-y-2">
              {(item.children ?? []).map((child) => (
                <li key={child.id}>
                  {child.path ? (
                    <Link
                      href={child.path}
                      target={child.target === "_blank" ? "_blank" : undefined}
                      onClick={onClose}
                      className="block text-sm leading-5 text-gray-900 transition-colors hover:text-green-700"
                    >
                      {child.menuName}
                    </Link>
                  ) : (
                    <span className="block text-sm leading-5 text-gray-600">
                      {child.menuName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

function MobileFullMenu({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: Menu[];
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-40 transition lg:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="전체 메뉴 닫기"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[360px] flex-col overflow-y-auto bg-[#5f9d2f] px-8 pb-10 pt-7 text-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-base font-bold text-green-700">
              안
            </span>
            <span className="text-lg font-bold leading-tight">{BRAND}</span>
          </Link>
          <button
            type="button"
            aria-label="전체 메뉴 닫기"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-md border border-white/25 text-white transition-colors hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav>
          {items.map((item) => (
            <MobileMenuGroup key={item.id} item={item} onClose={onClose} />
          ))}
        </nav>
      </aside>
    </div>
  );
}

function MobileMenuGroup({ item, onClose }: { item: Menu; onClose: () => void }) {
  const children = item.children ?? [];

  return (
    <section className="border-b border-white/35 py-6">
      {item.path ? (
        <Link
          href={item.path}
          target={item.target === "_blank" ? "_blank" : undefined}
          onClick={onClose}
          className="block text-xl font-bold leading-7 text-white"
        >
          {item.menuName}
        </Link>
      ) : (
        <h2 className="text-xl font-bold leading-7 text-white">{item.menuName}</h2>
      )}

      {children.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {children.map((child) => (
            <li key={child.id}>
              {child.path ? (
                <Link
                  href={child.path}
                  target={child.target === "_blank" ? "_blank" : undefined}
                  onClick={onClose}
                  className="block text-sm font-medium leading-6 text-white/95 transition-colors hover:text-white"
                >
                  {child.menuName}
                </Link>
              ) : (
                <span className="block text-sm font-medium leading-6 text-white/80">
                  {child.menuName}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
