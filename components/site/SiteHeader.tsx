"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { T } from "@/components/i18n/T";
import { LocaleToggle } from "@/components/i18n/LocaleToggle";
import { brand, nav } from "@/content/site";

// Difference blending keeps the header legible as sections flip paper ↔ ink.
export function SiteHeader() {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (v: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+1.1rem)] text-white mix-blend-difference sm:px-8">
        <Link href="/" className="font-wide text-[15px] font-semibold tracking-[0.02em]" aria-label="SERIAL home">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] md:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-opacity hover:opacity-100 ${pathname === item.href ? "opacity-100" : "opacity-60"}`}
            >
              <T value={item.label} />
            </Link>
          ))}
          <LocaleToggle className="text-[12px]" />
        </nav>
        <button
          type="button"
          className="text-[13px] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <T value={open ? { ko: "닫기", en: "Close" } : { ko: "메뉴", en: "Menu" }} />
        </button>
      </header>

      <div
        id="mobile-menu"
        hidden={!open}
        className="theme-ink fixed inset-0 z-40 flex flex-col justify-between px-5 pt-24 pb-10 md:hidden"
      >
        <nav className="flex flex-col gap-3" aria-label="Mobile">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="font-wide text-4xl font-semibold tracking-[-0.01em]">
              <T value={item.label} />
            </Link>
          ))}
        </nav>
        <div className="flex items-end justify-between text-sm text-muted-ink">
          <LocaleToggle />
          <span className="label">{brand.established}</span>
        </div>
      </div>
    </>
  );
}
