"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { T } from "@/components/i18n/T";
import { introPage } from "@/content/site";
import { getLenis, prefersReducedMotion } from "@/lib/motion";

// The intro page's contents, beside the sections on wide screens. It stays in
// view, marks the section being read, and jumps to any of them, so the order
// of the page is always visible.
export function IntroContents() {
  const [active, setActive] = useState(introPage.sections[0].id);

  useEffect(() => {
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
  }, []);

  const go = (event: MouseEvent, id: string) => {
    const el = document.getElementById(id);
    const lenis = getLenis();
    if (!el) return;
    event.preventDefault();
    if (lenis && !prefersReducedMotion()) lenis.scrollTo(el, { offset: -96, duration: 1.4 });
    else el.scrollIntoView();
    history.replaceState(null, "", `#${id}`);
  };

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
                <span className="label">{String(i + 1).padStart(2, "0")}</span>
                <T value={section.label} />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
