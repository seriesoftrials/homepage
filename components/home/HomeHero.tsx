"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { RibbonCanvas, type RibbonHandle } from "@/components/ribbon/RibbonCanvas";
import { hero, loader } from "@/content/site";
import {
  coverRadius,
  gsap,
  LOOP_RATIO,
  LOOSE_LOOP_RX,
  LOOSE_LOOP_RY,
  lockScroll,
  prefersReducedMotion,
} from "@/lib/motion";

// Ribbon sequence keyframes (lib/ribbon/sequence.js KEYFRAMES): S settles at
// 0.297 and the first turn runs from 0.531 to 1.
const S_SETTLED = 0.297;
const TURN_START = 0.531;
// Scroll shares: form the S, hold it under the last caption, then start turning
// as the next section's oval opens over it.
const FORM_END = 0.62;
const HOLD_END = 0.88;

function ribbonProgress(p: number) {
  if (p <= FORM_END) return (p / FORM_END) * S_SETTLED;
  if (p <= HOLD_END) return S_SETTLED;
  return TURN_START + ((p - HOLD_END) / (1 - HOLD_END)) * 0.25;
}

// The loader only plays on the first full load; client navigation back home
// opens straight onto the hero.
let introPlayed = false;
const MIN_LOADER_SECONDS = 1.4;

export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGEllipseElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const ribbon = useRef<RibbonHandle>(null);
  const ribbonIsReady = useRef(false);
  const resolveRibbon = useRef<(() => void) | null>(null);
  const onRibbonReady = () => {
    ribbonIsReady.current = true;
    resolveRibbon.current?.();
  };

  useGSAP(
    () => {
      const win = windowRef.current!;
      const reduced = prefersReducedMotion();
      const items = (selector: string) => root.current!.querySelectorAll(selector);
      const captions = gsap.utils.toArray<HTMLElement>("[data-stage]", root.current);
      const size = () => Math.min(innerWidth * 0.82, innerHeight * 0.84);

      // Scroll story: the loose loop crosses, twists and settles into the S.
      const scrollStory = () => {
        const proxy = { p: 0 };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
        });
        tl.to(proxy, {
          p: 1,
          duration: 1,
          onUpdate: () => ribbon.current?.setProgress(ribbonProgress(proxy.p)),
        }, 0);
        tl.to(items("[data-hero-title] [data-twist-item]"), { ...TWIST_FROM, rotationX: 100, stagger: 0.005, duration: 0.08 }, 0.01);
        tl.to(items("[data-scroll-hint]"), { opacity: 0, duration: 0.05 }, 0);
        // Captions follow the ribbon stages; the last one lands as the S settles.
        const starts = [0.06, 0.22, 0.4, FORM_END - 0.04];
        captions.forEach((caption, i) => {
          const at = starts[i];
          const span = (starts[i + 1] ?? HOLD_END) - at;
          const parts = caption.querySelectorAll("[data-twist-item]");
          tl.fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.02 }, at);
          tl.fromTo(parts, TWIST_FROM, { ...TWIST_TO, stagger: 0.01, duration: 0.07 }, at);
          if (i < captions.length - 1) {
            tl.to(parts, { rotationX: 100, yPercent: -35, opacity: 0, stagger: 0.008, duration: 0.05 }, at + span - 0.06);
            tl.to(caption, { opacity: 0, duration: 0.02 }, at + span - 0.02);
          }
        });
        return tl;
      };

      if (reduced) {
        ribbon.current?.setProgress(S_SETTLED);
        gsap.set(win, { "--rx": "200vmax", "--ry": "200vmax" });
        gsap.set(loaderRef.current, { display: "none" });
        gsap.set(captions.at(-1)!, { opacity: 1 });
        introPlayed = true;
        return;
      }

      if (introPlayed) {
        gsap.set(win, { "--rx": "200vmax", "--ry": "300vmax" });
        gsap.set(loaderRef.current, { display: "none" });
        twistIn(gsap.timeline(), items("[data-hero-title] [data-twist-item]"), 0.1, 0.04);
        scrollStory();
        return;
      }

      // Loader: the ring is drawn by load progress, fills with paper exactly where
      // the 3D loose loop sits, then opens the same way every section does.
      document.documentElement.classList.add("is-intro");
      lockScroll(true);
      const rx = size() * LOOSE_LOOP_RX;
      const ry = size() * LOOSE_LOOP_RY;
      gsap.set(ring.current, { attr: { rx, ry } });
      // Dash values in real path units; GSAP rounds px, so a 0–1 pathLength would step.
      const circumference = ring.current!.getTotalLength();
      ring.current!.style.strokeDasharray = `${circumference}`;
      gsap.set(items("[data-hero-title] [data-twist-item]"), TWIST_FROM);

      const load = { value: 0 };
      const showLoad = () => {
        ring.current!.style.strokeDashoffset = `${circumference * (1 - load.value)}`;
        if (percent.current) percent.current.textContent = String(Math.round(load.value * 100)).padStart(3, "0");
      };
      // Creeps toward 90% while waiting, then completes once everything is ready.
      const creep = gsap.to(load, { value: 0.9, duration: 3, ease: "power2.out", onUpdate: showLoad });
      const minimum = new Promise((resolve) => setTimeout(resolve, MIN_LOADER_SECONDS * 1000));
      let cancelled = false;

      const ribbonLoaded = new Promise<void>((resolve) => {
        if (ribbonIsReady.current) resolve();
        else resolveRibbon.current = resolve;
      });

      Promise.all([ribbonLoaded, document.fonts.ready, minimum]).then(() => {
        if (cancelled) return;
        creep.kill();
        const full = coverRadius(innerWidth, innerHeight);
        const intro = gsap.timeline({
          onComplete: () => {
            introPlayed = true;
            // Hold the window open regardless of later resizes.
            gsap.set(win, { "--rx": "200vmax", "--ry": "300vmax" });
            gsap.set(loaderRef.current, { display: "none" });
            lockScroll(false);
            scrollStory();
          },
        });
        intro
          .to(load, { value: 1, duration: 0.5, ease: "power2.inOut", onUpdate: showLoad })
          .fromTo(win, { "--rx": "0px", "--ry": "0px" }, { "--rx": `${rx}px`, "--ry": `${ry}px`, duration: 0.7, ease: "expo.out" })
          .to(items("[data-loader-label]"), { opacity: 0, duration: 0.3 }, "<")
          .to(ring.current, { opacity: 0, duration: 0.4 }, "<0.3")
          .addLabel("open", "+=0.15")
          .to(win, { "--rx": `${full}px`, "--ry": `${full * LOOP_RATIO}px`, duration: 1.6, ease: "expo.inOut" }, "open")
          .call(() => document.documentElement.classList.remove("is-intro"), [], "open+=0.9")
          .fromTo(items("[data-hero-title] [data-twist-item]"), TWIST_FROM, { ...TWIST_TO, stagger: 0.04, duration: 0.9 }, "open+=0.7")
          .fromTo(items("[data-scroll-hint]"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, "open+=1.2");
      });

      return () => {
        cancelled = true;
        document.documentElement.classList.remove("is-intro");
        lockScroll(false);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[400svh]" aria-label="SERIAL">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        <div
          ref={windowRef}
          className="hero-window theme-paper absolute inset-0"
          style={{ clipPath: "ellipse(var(--rx, 0px) var(--ry, 0px) at 50% 50%)" }}
        >
          <div className="absolute inset-x-0 top-[13svh] z-10 flex flex-col items-center px-6 text-center">
            <p className="mb-3 text-xs tracking-[0.2em] text-muted-paper uppercase">
              <T value={hero.eyebrow} />
            </p>
            <h1 data-hero-title className="twist-host font-serif text-[clamp(2.75rem,8.5vw,8.5rem)] leading-none tracking-[-0.03em]">
              <span aria-hidden="true">
                {Array.from(hero.title).map((char, i) => (
                  <span key={i} data-twist-item>
                    {char === " " ? " " : char}
                  </span>
                ))}
              </span>
              <span className="sr-only">SERIAL: {hero.title}</span>
            </h1>
          </div>

          <RibbonCanvas
            ref={ribbon}
            poster={false}
            onReady={onRibbonReady}
            className="absolute left-1/2 top-1/2 h-[min(82vw,84svh)] w-[min(82vw,84svh)] -translate-x-1/2 -translate-y-1/2"
          />

          <div className="absolute inset-x-0 bottom-[11svh] z-10 grid place-items-center px-6 text-center">
            {hero.stages.map((stage) => (
              <div key={stage.tag} data-stage className="col-start-1 row-start-1 opacity-0">
                <p className="mb-2 font-mono text-[11px] tracking-[0.18em] text-muted-paper uppercase">{stage.tag}</p>
                <TwistText text={stage.text} split="word" mode="manual" className="text-[clamp(1.25rem,2.6vw,2.25rem)] font-medium tracking-[-0.02em]" />
              </div>
            ))}
          </div>

          <p data-scroll-hint className="absolute inset-x-0 bottom-6 text-center text-xs text-muted-paper opacity-0">
            <T value={hero.scroll} />
          </p>
        </div>

        <div ref={loaderRef} className="pointer-events-none absolute inset-0 text-paper" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <ellipse
              ref={ring}
              cx="50%"
              cy="50%"
              rx="0"
              ry="0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
          <div data-loader-label className="absolute inset-x-0 bottom-8 flex justify-between px-6 font-mono text-[11px] tracking-[0.18em] uppercase">
            <span>{loader.label}</span>
            <span ref={percent}>000</span>
          </div>
        </div>
      </div>
    </section>
  );
}
