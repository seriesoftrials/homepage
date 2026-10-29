"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { RibbonCanvas, type RibbonHandle } from "@/components/ribbon/RibbonCanvas";
import { brand, hero } from "@/content/site";
import { coverRadius, gsap, LOOP_RATIO, LOOSE_LOOP_RX, LOOSE_LOOP_RY, lockScroll, prefersReducedMotion } from "@/lib/motion";

// Ribbon sequence keyframe (lib/ribbon/sequence.js KEYFRAMES.s): the S settles.
const S_SETTLED = 0.297;
// Scroll shares of the hero: form the S, hold it, then dive into its band.
const FORM_END = 0.5;
const HOLD_END = 0.66;
const ZOOM_END = 0.97;
// Widest point of the settled band (measured from lib/ribbon: inscribed radius
// 0.104 at the centre), and a zoom that lets it cover any viewport (a tall phone
// needs about 43×).
const FOCUS = { x: -0.013, y: 0.013 };
const MAX_ZOOM = 60;
// The ribbon is framed in the same square the loader ring is sized from.
const ribbonBox = (w: number, h: number) => Math.min(w * 0.82, h * 0.84);

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
  const inkFade = useRef<HTMLDivElement>(null);
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
      const items = (selector: string) => root.current!.querySelectorAll(selector);
      const captions = gsap.utils.toArray<HTMLElement>("[data-stage]", root.current);
      const titleItems = items("[data-hero-title] [data-twist-item]");

      // Scroll story: the loose loop crosses, twists and settles into the S;
      // then the camera dives into the black band until it becomes the next page.
      const scrollStory = () => {
        const state = { form: 0, zoom: 0 };
        const apply = () => {
          ribbon.current?.setProgress(state.form * S_SETTLED);
          const z = Math.exp(state.zoom * Math.log(MAX_ZOOM));
          ribbon.current?.setCamera(z, FOCUS.x * state.zoom, FOCUS.y * state.zoom);
        };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
        });
        tl.to(state, { form: 1, duration: FORM_END, onUpdate: apply }, 0)
          .to(state, { zoom: 1, duration: ZOOM_END - HOLD_END, ease: "power2.in", onUpdate: apply }, HOLD_END)
          .to(titleItems, { rotationX: 100, yPercent: -35, opacity: 0, stagger: 0.004, duration: 0.06 }, 0.01)
          .to(items("[data-hero-eyebrow], [data-scroll-cue]"), { opacity: 0, duration: 0.04 }, 0)
          .fromTo(inkFade.current, { opacity: 0 }, { opacity: 1, duration: 1 - ZOOM_END + 0.08 }, ZOOM_END - 0.08);
        // Captions follow the ribbon stages; the last one lands as the S settles.
        const starts = [0.05, 0.17, 0.3, FORM_END - 0.04];
        captions.forEach((caption, i) => {
          const at = starts[i];
          const end = starts[i + 1] ?? HOLD_END;
          const parts = caption.querySelectorAll("[data-twist-item]");
          tl.fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at)
            .fromTo(parts, TWIST_FROM, { ...TWIST_TO, stagger: 0.008, duration: 0.05 }, at)
            .to(parts, { rotationX: 100, yPercent: -35, opacity: 0, stagger: 0.006, duration: 0.04 }, end - 0.05)
            .to(caption, { opacity: 0, duration: 0.01 }, end - 0.01);
        });
        return tl;
      };

      if (prefersReducedMotion()) {
        ribbon.current?.setProgress(S_SETTLED);
        gsap.set(win, { "--rx": "200vmax", "--ry": "300vmax" });
        gsap.set(loaderRef.current, { display: "none" });
        gsap.set(captions.at(-1)!, { opacity: 1 });
        introPlayed = true;
        return;
      }

      if (introPlayed) {
        gsap.set(win, { "--rx": "200vmax", "--ry": "300vmax" });
        gsap.set(loaderRef.current, { display: "none" });
        twistIn(gsap.timeline(), titleItems, 0.1, 0.04);
        scrollStory();
        return;
      }

      // Loader: the ring is drawn by load progress, fills with paper exactly where
      // the 3D loose loop sits, then opens onto the whole hero.
      document.documentElement.classList.add("is-intro");
      lockScroll(true);
      const box = ribbonBox(innerWidth, innerHeight);
      const rx = box * LOOSE_LOOP_RX;
      const ry = box * LOOSE_LOOP_RY;
      gsap.set(ring.current, { attr: { rx, ry } });
      // Dash values in real path units; GSAP rounds px, so a 0–1 pathLength would step.
      const circumference = ring.current!.getTotalLength();
      ring.current!.style.strokeDasharray = `${circumference}`;
      gsap.set(titleItems, TWIST_FROM);
      gsap.set(items("[data-hero-eyebrow], [data-scroll-cue]"), { opacity: 0 });

      const load = { value: 0 };
      const showLoad = () => {
        ring.current!.style.strokeDashoffset = `${circumference * (1 - load.value)}`;
        if (percent.current) percent.current.textContent = String(Math.round(load.value * 100)).padStart(3, "0");
      };
      // Creeps toward 90% while waiting, then completes once everything is ready.
      const creep = gsap.to(load, { value: 0.9, duration: 3, ease: "power2.out", onUpdate: showLoad });
      const minimum = new Promise((resolve) => setTimeout(resolve, MIN_LOADER_SECONDS * 1000));
      const ribbonLoaded = new Promise<void>((resolve) => {
        if (ribbonIsReady.current) resolve();
        else resolveRibbon.current = resolve;
      });
      let cancelled = false;

      Promise.all([ribbonLoaded, document.fonts.ready, minimum]).then(() => {
        if (cancelled) return;
        creep.kill();
        const full = coverRadius(innerWidth, innerHeight);
        gsap
          .timeline({
            onComplete: () => {
              introPlayed = true;
              // Hold the window open regardless of later resizes.
              gsap.set(win, { "--rx": "200vmax", "--ry": "300vmax" });
              gsap.set(loaderRef.current, { display: "none" });
              lockScroll(false);
              scrollStory();
            },
          })
          .to(load, { value: 1, duration: 0.5, ease: "power2.inOut", onUpdate: showLoad })
          .fromTo(win, { "--rx": "0px", "--ry": "0px" }, { "--rx": `${rx}px`, "--ry": `${ry}px`, duration: 0.7, ease: "expo.out" })
          .to(items("[data-loader-label]"), { opacity: 0, duration: 0.3 }, "<")
          .to(ring.current, { opacity: 0, duration: 0.4 }, "<0.3")
          .addLabel("open", "+=0.15")
          .to(win, { "--rx": `${full}px`, "--ry": `${full * LOOP_RATIO}px`, duration: 1.6, ease: "expo.inOut" }, "open")
          .call(() => document.documentElement.classList.remove("is-intro"), [], "open+=0.9")
          .fromTo(titleItems, TWIST_FROM, { ...TWIST_TO, stagger: 0.04, duration: 0.9 }, "open+=0.7")
          .to(items("[data-hero-eyebrow]"), { opacity: 1, duration: 0.8 }, "open+=0.9")
          .to(items("[data-scroll-cue]"), { opacity: 1, duration: 0.6 }, "open+=1.3");
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
    <section ref={root} className="relative h-[520svh]" aria-label="SERIAL">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink">
        <div
          ref={windowRef}
          className="hero-window theme-paper absolute inset-0"
          style={{ clipPath: "ellipse(var(--rx, 0px) var(--ry, 0px) at 50% 50%)" }}
        >
          <RibbonCanvas
            ref={ribbon}
            poster={false}
            material="satin"
            interactive
            frame={ribbonBox}
            onReady={onRibbonReady}
            className="absolute inset-0"
          />

          <div className="pointer-events-none absolute inset-x-0 top-[13svh] flex flex-col items-center px-6 text-center">
            <p data-hero-eyebrow className="mb-3 text-xs tracking-[0.2em] text-muted-paper uppercase">
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

          <div className="pointer-events-none absolute inset-x-0 bottom-[12svh] grid place-items-center px-6 text-center">
            {hero.stages.map((stage, i) => (
              <div key={i} data-stage className="col-start-1 row-start-1 opacity-0">
                <TwistText text={stage} split="word" mode="manual" className="text-[clamp(1.25rem,2.6vw,2.25rem)] font-medium tracking-[-0.02em]" />
              </div>
            ))}
          </div>

          <div data-scroll-cue className="absolute inset-x-0 bottom-7 flex justify-center text-ink">
            <ScrollCue label={hero.scroll} />
          </div>

          {/* The dive ends inside the black band; this hands its colour to the next section. */}
          <div ref={inkFade} className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
        </div>

        <div ref={loaderRef} className="pointer-events-none absolute inset-0 text-paper" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <ellipse ref={ring} cx="50%" cy="50%" rx="0" ry="0" fill="none" stroke="currentColor" strokeWidth="1.25" />
          </svg>
          <div data-loader-label className="absolute inset-x-0 bottom-8 flex justify-between px-6 font-mono text-[11px] tracking-[0.18em] uppercase">
            <span>{brand.name}</span>
            <span ref={percent}>000</span>
          </div>
        </div>
      </div>
    </section>
  );
}
