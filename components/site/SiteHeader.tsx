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
          <LocaleToggle />
        </nav>
        <button
          type="button"
          className={`menu-icon -mr-2 grid size-10 cursor-pointer place-items-center md:hidden ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">
            <T value={open ? { ko: "메뉴 닫기", en: "Close menu" } : { ko: "메뉴 열기", en: "Open menu" }} />
          </span>
          <span aria-hidden="true" className="menu-icon__bars">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      {/* Always mounted so it can slide in and out; inert while closed. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`mobile-menu theme-ink fixed inset-0 z-40 flex flex-col justify-between px-5 pt-24 pb-10 md:hidden ${open ? "is-open" : ""}`}
      >
        <nav className="flex flex-col gap-3" aria-label="Mobile">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-menu__item font-wide text-4xl font-semibold tracking-[-0.01em]"
              style={{ transitionDelay: open ? `${0.18 + i * 0.05}s` : "0s" }}
            >
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
