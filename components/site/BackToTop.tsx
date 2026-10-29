"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { T } from "@/components/i18n/T";
import { getLenis, prefersReducedMotion } from "@/lib/motion";

// Appears near the end of any page that scrolls, at the bottom right, and glides
// back to the top. Once the footer scrolls in, it rides up to stay clear of it. Out of range it is removed
// with `hidden` (not only faded by CSS), so it can never linger at the top of a
// page or over the intro loader.
// Space kept between the button and the footer's top edge.
const FOOTER_GAP = 16;

export function BackToTop() {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    const box = wrap.current;
    if (!el || !box) return;
    const footer = document.querySelector("footer");
    let lift = 0;
    const update = () => {
      if (footer) {
        const base = innerHeight - box.getBoundingClientRect().bottom - lift;
        lift = Math.max(0, innerHeight - base - (footer.getBoundingClientRect().top - FOOTER_GAP));
        box.style.transform = lift ? `translateY(${-lift}px)` : "";
      }
      const max = document.documentElement.scrollHeight - innerHeight;
      const show =
        !document.documentElement.classList.contains("is-intro") &&
        max > innerHeight * 0.5 &&
        max - scrollY < innerHeight * 0.35;
      if (show && el.hidden) {
        el.hidden = false;
        // Let the hidden state paint once so the fade-in runs.
        requestAnimationFrame(() => el.classList.add("is-shown"));
      } else if (!show && !el.hidden) {
        el.classList.remove("is-shown");
        el.hidden = true;
      }
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
    <div ref={wrap} className="pointer-events-none fixed right-5 bottom-6 z-40 mix-blend-difference sm:right-8 sm:bottom-8">
      <button ref={ref} type="button" hidden onClick={toTop} className="back-to-top pointer-events-auto grid size-11 place-items-center rounded-full text-white">
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
