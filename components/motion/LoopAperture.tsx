"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { twistIn } from "./TwistText";

export type Theme = "paper" | "ink";

type Props = {
  theme: Theme;
  // Shown inside the arch while it rises (usually the section title).
  cover: ReactNode;
  children?: ReactNode;
  id?: string;
  // Extra pinned scroll (in svh) after the arch has filled the screen, for `extend`.
  hold?: number;
  // Adds scrubbed tweens to the same timeline; the full arch ends at time 1 and
  // the hold runs from 1 to 1 + hold / 100.
  extend?: (tl: gsap.core.Timeline, win: HTMLDivElement) => void;
};

// The site's one repeated transition. The section slides over the last screen of
// the previous one and rises from the bottom centre as an arch whose top is the
// upper half of the ribbon's loose loop, widening until it fills the viewport.
// Themes alternate, so each rise turns the page to its other face, paper to ink
// and back. Values are viewport units, so the timeline never needs invalidating
// on refresh (which would drop the hidden start state of later tweens).
export const ARCH_FROM = { "--y": "100svh", "--x": "26vw", "--rx": "24vw", "--ry": "36svh" };
export const ARCH_TO = { "--y": "0svh", "--x": "0vw", "--rx": "0vw", "--ry": "0svh" };
export const ARCH_CLIP =
  "inset(var(--y, 100svh) var(--x, 26vw) 0 var(--x, 26vw) round var(--rx, 24vw) var(--rx, 24vw) 0 0 / var(--ry, 36svh) var(--ry, 36svh) 0 0)";

export function LoopAperture({ theme, cover, children, id, hold = 0, extend }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const win = windowRef.current;
      if (!stage.current || !win) return;
      if (prefersReducedMotion()) {
        gsap.set(win, ARCH_TO);
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      // The arch fills the screen a little before the pin ends, so the last few
      // pixels of scroll (or a page that ends on this section) never leave a
      // sliver of the previous colour at the edges.
      const rise = 0.85;
      tl.fromTo(win, { "--y": ARCH_FROM["--y"] }, { "--y": ARCH_TO["--y"], duration: rise, ease: "power1.out" }, 0)
        .fromTo(win, { "--x": ARCH_FROM["--x"] }, { "--x": ARCH_TO["--x"], duration: rise, ease: "power2.in" }, 0)
        .fromTo(
          win,
          { "--rx": ARCH_FROM["--rx"], "--ry": ARCH_FROM["--ry"] },
          { "--rx": ARCH_TO["--rx"], "--ry": ARCH_TO["--ry"], duration: rise, ease: "power2.in" },
          0,
        );
      // Pieces marked data-defer are left for `extend` to reveal during the hold.
      const coverItems = Array.from(win.querySelectorAll("[data-cover] [data-twist-item]")).filter(
        (el) => !el.closest("[data-defer]"),
      );
      twistIn(tl, coverItems, 0.3, 0.05);
      if (hold > 0) extend?.(tl, win);
      tl.set({}, {}, 1 + hold / 100);
    },
    { scope: stage },
  );

  return (
    <section id={id} className="relative">
      <div ref={stage} className="relative mt-[-100svh]" style={{ height: `${200 + hold}svh` }}>
        {/* While the arch rises, the previous section scrolls up and away; this
            filler continues its colour (themes alternate) so no gap shows below it. */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-[100svh] h-svh ${theme === "ink" ? "theme-paper" : "theme-ink"}`}
        />
        <div className="sticky top-0 h-svh overflow-hidden">
          <div
            ref={windowRef}
            className={`theme-${theme} absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-6`}
            style={{ clipPath: ARCH_CLIP }}
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
