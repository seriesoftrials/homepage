"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { EyeLoader, introPending } from "@/components/motion/EyeLoader";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { hero, reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// The home page's first screen. SERIAL flips in (as the loader's eye opens, on
// a first visit); scrolling then unfolds the hidden letters between them,
// SER·IAL becoming SERies of trIALs, and the slogan and the Möbius story
// follow. The wordmark keeps its size throughout: scaling type renders it soft.
// The next section rises over it as an arch.
export function HomeReveal() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const all = (selector: string) => root.current!.querySelectorAll(selector);
  const enter = (tl: gsap.core.Timeline, at: gsap.Position) => {
    twistIn(tl, all("[data-kept] [data-twist-item]"), at, 0.05);
    tl.to(all("[data-cue]"), { opacity: 1, duration: 0.6 }, typeof at === "string" ? `${at}+=0.6` : Number(at) + 0.6);
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const expanders = all("[data-expander]");
      gsap.set(expanders, { width: 0 });
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
        })
        .to(all("[data-cue]"), { opacity: 0, duration: 0.05 }, 0)
        .to(expanders, { width: "auto", duration: 0.4, ease: "power2.inOut" }, 0.05)
        .fromTo(all("[data-expander] [data-twist-item]"), TWIST_FROM, { ...TWIST_TO, stagger: 0.02, duration: 0.2 }, 0.15)
        .fromTo(all("[data-after] [data-twist-item]"), TWIST_FROM, { ...TWIST_TO, stagger: 0.04, duration: 0.2 }, 0.55)
        .set({}, {}, 1);

      // On a first visit the loader plays the entrance as its eye opens.
      if (introPending()) {
        gsap.set(all("[data-kept] [data-twist-item]"), TWIST_FROM);
        gsap.set(all("[data-cue]"), { opacity: 0 });
      } else {
        enter(gsap.timeline(), 0.1);
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[260svh]" aria-label="SERIAL">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        <div
          ref={windowRef}
          className="hero-window theme-paper absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <h1
            aria-label="SERIAL: Series of Trials"
            className="twist-host font-wide text-[clamp(1rem,5.6vw,5.5rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
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
