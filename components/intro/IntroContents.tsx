"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { T } from "@/components/i18n/T";
import { introPage } from "@/content/site";
import { getLenis, prefersReducedMotion } from "@/lib/motion";

const number = (i: number) => String(i + 1).padStart(2, "0");

// The intro page's contents. `list` is the large one on the first screen, each
// entry with its one-line summary; `rail` stays beside the sections on wide
// screens and marks the one being read, so the order is always in view.
export function IntroContents({ variant }: { variant: "list" | "rail" }) {
  const [active, setActive] = useState(introPage.sections[0].id);

  useEffect(() => {
    if (variant !== "rail") return;
    // The section crossing the middle of the screen is the one being read.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const section of introPage.sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [variant]);

  const go = (event: MouseEvent, id: string) => {
    const el = document.getElementById(id);
    const lenis = getLenis();
    if (!el) return;
    event.preventDefault();
    if (lenis && !prefersReducedMotion()) lenis.scrollTo(el, { offset: -96, duration: 1.4 });
    else el.scrollIntoView();
    history.replaceState(null, "", `#${id}`);
  };

  if (variant === "rail") {
    return (
      <nav aria-label="Contents" className="sticky top-28">
        <ol className="flex flex-col gap-3 text-sm">
          {introPage.sections.map((section, i) => {
            const current = section.id === active;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => go(event, section.id)}
                  aria-current={current ? "true" : undefined}
                  className={`flex items-center gap-3 transition-colors ${current ? "text-(--fg)" : "text-(--muted) hover:text-(--fg)"}`}
                >
                  <span className={`h-px bg-current transition-[width] duration-500 ${current ? "w-6" : "w-3"}`} />
                  <span className="label">{number(i)}</span>
                  <T value={section.label} />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Contents">
      <ol className="border-t border-(--line)">
        {introPage.sections.map((section, i) => (
          <li key={section.id} className="border-b border-(--line)">
            <a
              href={`#${section.id}`}
              onClick={(event) => go(event, section.id)}
              className="group flex items-center gap-4 py-4 sm:gap-6"
            >
              <span className="label w-6 text-(--muted)">{number(i)}</span>
              <span className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-wide text-[clamp(1.1rem,1.6vw,1.4rem)] leading-none font-semibold sm:w-40">
                  <T value={section.label} />
                </span>
                <span className="text-[13px] text-(--muted) transition-colors group-hover:text-(--fg)">
                  <T value={section.line} />
                </span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="shrink-0 text-(--muted) transition-[translate,color] duration-500 group-hover:translate-y-0.5 group-hover:text-(--fg)"
              >
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
