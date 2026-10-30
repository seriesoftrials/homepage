"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { EyeLoader, introPending } from "@/components/motion/EyeLoader";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { hero, reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Size of SERIAL alone before it unfolds, relative to the full wordmark.
const MARK_START = 1.35;

// The home page's first screen, played on its own (no scrolling needed):
// SERIAL flips in large (as the loader's eye opens, on a first visit), then
// shrinks as the hidden letters unfold between them, SER·IAL becoming
// SERies of trIALs, and the slogan and the Möbius story follow. It shrinks by
// font size, not scale: scaled type renders soft. Scrolling raises the next
// section over it as an arch.
export function HomeReveal() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const all = (selector: string) => root.current!.querySelectorAll(selector);
  const enter = (tl: gsap.core.Timeline, at: gsap.Position) => {
    const mark = root.current!.querySelector<HTMLElement>("[data-mark]")!;
    tl.addLabel("reveal", at);
    twistIn(tl, all("[data-kept] [data-twist-item]"), "reveal", 0.05);
    tl.to(mark, { fontSize: mark.dataset.base, duration: 1.2, ease: "power2.inOut", clearProps: "fontSize" }, "reveal+=1.1")
      .to(all("[data-expander]"), { width: "auto", duration: 1.2, ease: "power2.inOut" }, "reveal+=1.1")
      .to(all("[data-expander] [data-twist-item]"), { ...TWIST_TO, stagger: 0.03, duration: 0.6 }, "reveal+=1.3")
      .to(all("[data-after] [data-twist-item]"), { ...TWIST_TO, stagger: 0.08, duration: 0.6 }, "reveal+=2.2")
      .to(all("[data-cue]"), { opacity: 1, duration: 0.6 }, "reveal+=2.9");
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mark = root.current!.querySelector<HTMLElement>("[data-mark]")!;
      // Start from SERIAL alone, large; the entrance plays the rest.
      mark.dataset.base = getComputedStyle(mark).fontSize;
      gsap.set(mark, { fontSize: parseFloat(mark.dataset.base) * MARK_START });
      gsap.set(all("[data-expander]"), { width: 0 });
      gsap.set(all("[data-expander] [data-twist-item], [data-after] [data-twist-item]"), TWIST_FROM);
      gsap.set(all("[data-cue]"), { opacity: 0 });

      // On a first visit the loader plays the entrance as its eye opens.
      if (introPending()) gsap.set(all("[data-kept] [data-twist-item]"), TWIST_FROM);
      else enter(gsap.timeline(), 0.1);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-svh" aria-label="SERIAL">
      <div className="absolute inset-0 overflow-hidden bg-ink">
        <div
          ref={windowRef}
          className="hero-window theme-paper absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <h1
            data-mark
            aria-label="SERIAL: Series of Trials"
            className="twist-host font-wide text-[clamp(1rem,7vw,6.5rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
          >
            {reveal.parts.map((part) =>
              part.keep ? (
                <span key={part.text} data-kept aria-hidden="true">
                  {Array.from(part.text).map((char, i) => (
                    <span key={i} data-twist-item>
                      {char}
                    </span>
                  ))}
                </span>
              ) : (
                <span key={part.text} data-expander aria-hidden="true" className="inline-block overflow-hidden align-bottom text-(--muted)">
                  {Array.from(part.text).map((char, i) => (
                    <span key={i} data-twist-item>
                      {char === " " ? " " : char}
                    </span>
                  ))}
                </span>
              ),
            )}
          </h1>

          <div data-after className="mt-14 flex flex-col items-center gap-8">
            <div>
              <TwistText as="p" text={{ ko: reveal.slogan, en: reveal.slogan }} split="word" mode="manual" className="font-serif text-[clamp(2rem,4.4vw,4rem)] leading-none italic" />
              <TwistText as="p" text={reveal.sloganSub} mode="manual" className="mt-3 text-sm text-(--muted)" />
            </div>
            <TwistText text={reveal.mobius} mode="manual" className="text-[15px] leading-[1.8] text-(--muted)" />
          </div>

          <div data-cue className="absolute inset-x-0 bottom-7 flex justify-center text-ink">
            <ScrollCue label={hero.scroll} />
          </div>
        </div>

        <EyeLoader target={windowRef} onReveal={enter} />
      </div>
    </section>
  );
}
