"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { COVER_VMAX, gsap, LOOP_RATIO, prefersReducedMotion } from "@/lib/motion";
import { twistIn } from "./TwistText";

export type Theme = "paper" | "ink";

type Props = {
  theme: Theme;
  // Shown inside the oval while it opens (trial label, title).
  cover: ReactNode;
  children?: ReactNode;
  id?: string;
  // Extra pinned scroll (in svh) after the oval is fully open, for `extend`.
  hold?: number;
  // Adds scrubbed tweens to the same timeline; the open oval ends at time 1 and
  // the hold runs from 1 to 1 + hold / 100.
  extend?: (tl: gsap.core.Timeline, win: HTMLDivElement) => void;
};

// The site's one repeated transition. The section slides over the last screen of
// the previous one, and an upright oval (the ribbon's loose loop) opens from the
// centre until it covers the viewport. Themes alternate, so each opening turns
// the page over to its other face, paper to ink and back.
export function LoopAperture({ theme, cover, children, id, hold = 0, extend }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const win = windowRef.current;
      if (!stage.current || !win || !ring.current) return;
      if (prefersReducedMotion()) {
        gsap.set(win, { "--rx": `${COVER_VMAX}vmax`, "--ry": `${COVER_VMAX * LOOP_RATIO}vmax` });
        gsap.set(ring.current, { opacity: 0 });
        return;
      }
      // Viewport-relative end sizes, so the timeline never needs invalidating on
      // refresh (which would drop the hidden start state of later tweens).
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.fromTo(
        win,
        { "--rx": "0vmax", "--ry": "0vmax" },
        { "--rx": `${COVER_VMAX}vmax`, "--ry": `${COVER_VMAX * LOOP_RATIO}vmax`, duration: 1, ease: "power2.in" },
        0,
      ).fromTo(
        ring.current,
        { width: "0vmax", height: "0vmax", opacity: 1 },
        {
          width: `${COVER_VMAX * 2.08}vmax`,
          height: `${COVER_VMAX * 2.08 * LOOP_RATIO}vmax`,
          opacity: 0,
          duration: 1,
          ease: "power2.in",
        },
        0,
      );
      // Pieces marked data-defer are left for `extend` to reveal during the hold.
      const coverItems = Array.from(win.querySelectorAll("[data-cover] [data-twist-item]")).filter(
        (el) => !el.closest("[data-defer]"),
      );
      twistIn(tl, coverItems, 0.35, 0.05);
      if (hold > 0) {
        extend?.(tl, win);
        tl.set({}, {}, 1 + hold / 100);
      }
    },
    { scope: stage },
  );

  return (
    <section id={id} className="relative">
      <div ref={stage} className="relative mt-[-100svh]" style={{ height: `${200 + hold}svh` }}>
        {/* While the oval opens, the previous section scrolls up and away; this
            filler continues its colour (themes alternate) so no gap shows below it. */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-[100svh] h-svh ${theme === "ink" ? "theme-paper" : "theme-ink"}`}
        />
        <div className="sticky top-0 h-svh overflow-hidden">
          <div
            ref={ring}
            aria-hidden="true"
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border ${
              theme === "ink" ? "border-ink" : "border-paper"
            }`}
          />
          <div
            ref={windowRef}
            className={`theme-${theme} absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-6`}
            style={{ clipPath: "ellipse(var(--rx, 0px) var(--ry, 0px) at 50% 50%)" }}
          >
            <div data-cover className="contents">
              {cover}
            </div>
          </div>
        </div>
      </div>
      {/* Pulled up under the released cover so the body follows its title closely. */}
      {children ? <div className={`theme-${theme} relative mt-[-25svh]`}>{children}</div> : null}
    </section>
  );
}
