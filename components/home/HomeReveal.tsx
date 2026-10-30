"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { EyeLoader, introPending } from "@/components/motion/EyeLoader";
import { TWIST_FROM, TWIST_TO, twistIn } from "@/components/motion/TwistText";
import { SiteFooter } from "@/components/site/SiteFooter";
import { hero, homeHero, join, reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Seconds SERIES OF TRIALS rests before folding back into SERIAL, and the
// pause before it unfolds again.
const LOOP_REST = 5;
const LOOP_HOLD = 1.2;

// The whole home page, one screen. SERIAL flips in (as the loader's eye opens,
// on a first visit), then the hidden letters unfold between them, SER·IAL
// widening into SERies of trIALs at the size it settles at, while a hairline
// like the logo's stroke draws beneath. From then on it keeps folding back into
// SERIAL and unfolding again, one trial after another; a letter under the
// pointer flips over. What the name means is told on the intro page.
export function HomeReveal() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const loop = useRef<gsap.core.Timeline | null>(null);
  const all = (selector: string) => root.current!.querySelectorAll(selector);
  const enter = (tl: gsap.core.Timeline, at: gsap.Position) => {
    tl.addLabel("reveal", at);
    twistIn(tl, all("[data-kept] [data-twist-item]"), "reveal", 0.05);
    tl.to(all("[data-expander]"), { width: "auto", duration: 1.2, ease: "power2.inOut" }, "reveal+=1.1")
      .to(all("[data-expander] [data-twist-item]"), { ...TWIST_TO, stagger: 0.03, duration: 0.6 }, "reveal+=1.3")
      .to(all("[data-line]"), { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, "reveal+=1.1")
      .to(all("[data-fade]"), { opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: "power2.out" }, "reveal+=2")
      .call(() => loop.current?.play(), [], "reveal+=2.4");
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const expanders = all("[data-expander]");
      const hidden = all("[data-expander] [data-twist-item]");
      // Start from SERIAL alone; the entrance plays the rest.
      gsap.set(expanders, { width: 0 });
      gsap.set(hidden, TWIST_FROM);
      gsap.set(all("[data-line]"), { scaleX: 0 });
      gsap.set(all("[data-fade]"), { opacity: 0, y: 10 });

      loop.current = gsap
        .timeline({ paused: true, repeat: -1, delay: LOOP_REST, repeatDelay: LOOP_REST })
        .to(hidden, { rotationX: 100, yPercent: -35, opacity: 0, stagger: { each: 0.02, from: "end" }, duration: 0.4 })
        .to(expanders, { width: 0, duration: 1, ease: "power2.inOut" }, "<0.15")
        .addLabel("unfold", `+=${LOOP_HOLD}`)
        .to(expanders, { width: "auto", duration: 1.2, ease: "power2.inOut" }, "unfold")
        .fromTo(hidden, TWIST_FROM, { ...TWIST_TO, stagger: 0.03, duration: 0.6 }, "unfold+=0.2");

      // A letter under the pointer turns over once.
      const flip = (event: Event) => {
        const letter = event.currentTarget as HTMLElement;
        if (gsap.isTweening(letter)) return;
        gsap.fromTo(letter, { rotationX: 0 }, { rotationX: 360, duration: 0.9, ease: "power2.inOut" });
      };
      const letters = matchMedia("(hover: hover)").matches ? Array.from(all("[data-kept] [data-twist-item]")) : [];
      letters.forEach((letter) => letter.addEventListener("pointerenter", flip));

      // On a first visit the loader plays the entrance as its eye opens.
      if (introPending()) gsap.set(all("[data-kept] [data-twist-item]"), TWIST_FROM);
      else enter(gsap.timeline(), 0.1);

      return () => letters.forEach((letter) => letter.removeEventListener("pointerenter", flip));
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
          <p data-fade className="mb-8 text-xs tracking-[0.2em] text-(--muted) uppercase">
            <T value={hero.eyebrow} />
          </p>

          <div className="inline-flex flex-col">
            <h1
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
            <span data-line aria-hidden="true" className="mt-[0.35em] block h-px w-full origin-center bg-current opacity-40" />
          </div>

          <p data-fade className="mt-8 font-serif text-[clamp(1.5rem,2.6vw,2.25rem)] leading-none italic">
            {homeHero.tagline}
          </p>

          <div data-fade className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/intro"
              className="rounded-full bg-(--fg) px-6 py-3 text-sm font-medium text-(--bg) transition-opacity hover:opacity-80"
            >
              <T value={homeHero.intro} />
            </Link>
            <Link
              href="/join"
              className="rounded-full px-6 py-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--fg)]"
            >
              <T value={join.cta} />
            </Link>
          </div>

          <SiteFooter inline />
        </div>

        <EyeLoader target={windowRef} onReveal={enter} />
      </div>
    </section>
  );
}
