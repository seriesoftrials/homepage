"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { T } from "@/components/i18n/T";
import { getLenis, prefersReducedMotion } from "@/lib/motion";

// Appears near the end of any page that scrolls, at the bottom right above the
// footer's coordinates, and glides back to the top.
export function BackToTop() {
  const ref = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      el.classList.toggle("is-shown", max > innerHeight * 0.5 && max - scrollY < innerHeight * 0.35);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [pathname]);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis && !prefersReducedMotion()) lenis.scrollTo(0, { duration: 1.8 });
    else scrollTo({ top: 0 });
  };

  return (
    <div className="pointer-events-none fixed right-5 bottom-28 z-40 mix-blend-difference sm:right-8 sm:bottom-24">
      <button ref={ref} type="button" onClick={toTop} className="back-to-top pointer-events-auto grid size-11 place-items-center rounded-full text-white">
        <span className="sr-only">
          <T value={{ ko: "맨 위로", en: "Back to top" }} />
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
