"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { RibbonCanvas, type RibbonHandle } from "@/components/ribbon/RibbonCanvas";
import { brand, hero } from "@/content/site";
import { gsap, lockScroll, prefersReducedMotion } from "@/lib/motion";

// Ribbon sequence keyframe (lib/ribbon/sequence.js KEYFRAMES.s): the S settles.
const S_SETTLED = 0.297;
// Seconds the loose loop takes to form into the S. The forming runs at an
// even pace, so the ribbon's own easing sets when each shape appears, and
// each caption lands with its shape, as it did when scroll drove the hero:
// share of the forming at which the loop, the crossing, the twist and the S
// are shown (the scroll story's caption starts, 0.05 / 0.17 / 0.3 / 0.46 of
// a 0.5 forming).
const FORM_SECONDS = 7;
const STAGE_AT = [0.1, 0.34, 0.6, 0.92];
// A caption flips in over this share of the forming and leaves just before
// the next one arrives.
const CAPTION_IN = 0.1;
const CAPTION_OUT = 0.08;
// Seconds the S rests with its caption, the unwinding back into the loop
// (a quick whirl: one full roll on screen as it untwists), and the pause
// before the story starts again.
const HOLD_SECONDS = 3;
const UNWIND_SECONDS = 1.4;
const REST_SECONDS = 0.8;
// The ribbon's frame: small enough to sit between the title and the captions
// without touching either. A phone's screen is tall and narrow, so there it
// takes nearly the full width to fill the space between them.
const ribbonBox = (w: number, h: number) => (w < 640 ? Math.min(w * 0.95, h * 0.5) : Math.min(w * 0.7, h * 0.56));

// The loader plays only when "/" itself was loaded by the browser (first visit
// or refresh); LocaleScript flags that before first paint. Arriving at home by
// clicking a link opens straight onto the hero.
declare global {
  interface Window {
    __serialIntro?: boolean;
  }
}
const MIN_LOADER_SECONDS = 1.4;

export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const ribbonWrap = useRef<HTMLDivElement>(null);
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
      let story: gsap.core.Timeline | null = null;

      // The hero holds still on one screen while the loose loop crosses, twists
      // and settles into the S on its own, each caption with its shape. The S
      // rests, its caption leaves, the ribbon whirls back into the loop, and
      // the story plays again.
      const formStory = () => {
        const state = { form: 0, roll: 0 };
        const apply = () => ribbon.current?.setProgress(state.form * S_SETTLED);
        const roll = () => ribbon.current?.setLean(state.roll);
        const tl = gsap.timeline({ delay: 0.3, repeat: -1, repeatDelay: REST_SECONDS });
        tl.to(state, { form: 1, duration: FORM_SECONDS, ease: "none", onUpdate: apply }, 0);
        captions.forEach((caption, i) => {
          const at = STAGE_AT[i] * FORM_SECONDS;
          const end = i < captions.length - 1 ? STAGE_AT[i + 1] * FORM_SECONDS : FORM_SECONDS + HOLD_SECONDS;
          const out = CAPTION_OUT * FORM_SECONDS;
          const parts = caption.querySelectorAll("[data-twist-item]");
          tl.set(caption, { opacity: 1 }, at)
            .fromTo(parts, TWIST_FROM, { ...TWIST_TO, stagger: 0.04, duration: CAPTION_IN * FORM_SECONDS }, at)
            .to(parts, { rotationX: 100, yPercent: -35, opacity: 0, stagger: 0.03, duration: out }, end - out)
            .set(caption, { opacity: 0 }, end);
        });
        const unwind = FORM_SECONDS + HOLD_SECONDS;
        tl.to(state, { form: 0, duration: UNWIND_SECONDS, ease: "power2.inOut", onUpdate: apply }, unwind)
          .fromTo(state, { roll: 0 }, { roll: -Math.PI * 2, duration: UNWIND_SECONDS, ease: "power3.inOut", onUpdate: roll }, unwind)
          // A full turn is where it started; reset so the next round rolls from 0.
          .set(state, { roll: 0, onComplete: roll });
        story = tl;
      };

      if (prefersReducedMotion()) {
        ribbon.current?.setProgress(S_SETTLED);
        gsap.set(loaderRef.current, { display: "none" });
        gsap.set(captions.at(-1)!, { opacity: 1 });
        return;
      }

      if (!window.__serialIntro) {
        gsap.set(loaderRef.current, { display: "none" });
        twistIn(gsap.timeline(), titleItems, 0.1, 0.04);
        formStory();
        return () => story?.kill();
      }

      // Loader, "See the real": a hairline grows across the centre like a
      // closed eyelid, by load progress. At 100% the lid flickers, opens into an
      // eye with "See the real." inside, and the eye widens until the hero fills
      // the screen.
      document.documentElement.classList.add("is-intro");
      lockScroll(true);
      const W = innerWidth;
      const H = innerHeight;
      const eyeWidth = Math.min(W * 0.62, 760);
      const eyeOpen = eyeWidth * 0.42; // lid separation at full opening
      gsap.set(titleItems, TWIST_FROM);
      gsap.set(ribbonWrap.current, { opacity: 0 });
      gsap.set(items("[data-hero-eyebrow], [data-scroll-cue]"), { opacity: 0 });

      // The eye is two quadratic curves meeting at the corners; `open` is the
      // distance between the lids at the centre, `scale` grows the whole eye.
      const eye = { open: 0, scale: 1 };
      const drawEye = () => {
        const a = (eyeWidth / 2) * eye.scale;
        const c = eye.open * eye.scale; // control offset; the lid apex sits at c / 2
        const cx = W / 2;
        const cy = H / 2;
        win.style.clipPath = `path("M ${cx - a} ${cy} Q ${cx} ${cy - c} ${cx + a} ${cy} Q ${cx} ${cy + c} ${cx - a} ${cy} Z")`;
      };
      // Smallest scale at which the eye covers the viewport's corners: the lid
      // at x is c/2 · (1 − (x/a)²) above the centre.
      let coverScale = 1;
      while (
        coverScale < 60 &&
        ((eyeOpen * coverScale) / 2) * (1 - (W / (eyeWidth * coverScale)) ** 2) < H / 2
      ) {
        coverScale *= 1.05;
      }

      const load = { value: 0 };
      const showLoad = () => {
        gsap.set(line.current, { width: eyeWidth * load.value });
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
        gsap
          .timeline({
            onComplete: () => {
              window.__serialIntro = false;
              win.style.clipPath = "none";
              gsap.set(loaderRef.current, { display: "none" });
              lockScroll(false);
              formStory();
            },
          })
          .to(load, { value: 1, duration: 0.5, ease: "power2.inOut", onUpdate: showLoad })
          .to(items("[data-loader-label]"), { opacity: 0, duration: 0.3 })
          .call(drawEye)
          .to(line.current, { opacity: 0, duration: 0.15 }, "+=0.1")
          // A flicker of the lid...
          .to(eye, { open: eyeOpen * 0.08, duration: 0.14, ease: "power2.out", onUpdate: drawEye }, "<")
          .to(eye, { open: 0, duration: 0.16, ease: "power2.in", onUpdate: drawEye })
          // ...then the eye opens, and the phrase surfaces inside it.
          .addLabel("open", "+=0.2")
          .to(eye, { open: eyeOpen, duration: 1.1, ease: "expo.out", onUpdate: drawEye }, "open")
          .fromTo(items("[data-eye-text]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "open+=0.25")
          // The eye widens until the hero fills the screen.
          .addLabel("widen", "open+=1.7")
          .to(items("[data-eye-text]"), { opacity: 0, duration: 0.4 }, "widen")
          .to(eye, { scale: coverScale * 1.05, duration: 1.6, ease: "power3.inOut", onUpdate: drawEye }, "widen")
          .fromTo(ribbonWrap.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, "widen+=0.9")
          .call(() => document.documentElement.classList.remove("is-intro"), [], "widen+=0.9")
          .fromTo(titleItems, TWIST_FROM, { ...TWIST_TO, stagger: 0.04, duration: 0.9 }, "widen+=0.7")
          .to(items("[data-hero-eyebrow]"), { opacity: 1, duration: 0.8 }, "widen+=0.9")
          .to(items("[data-scroll-cue]"), { opacity: 1, duration: 0.6 }, "widen+=1.3");
      });

      return () => {
        cancelled = true;
        story?.kill();
        ribbon.current?.setLean(0);
        document.documentElement.classList.remove("is-intro");
        lockScroll(false);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-svh" aria-label="SERIAL">
      <div className="absolute inset-0 overflow-hidden bg-ink">
        <div
          ref={windowRef}
          className="hero-window theme-paper absolute inset-0"
        >
          <div ref={ribbonWrap} className="absolute inset-0">
            <RibbonCanvas
              ref={ribbon}
              idle
              poster={false}
              material="satin"
              interactive
              frame={ribbonBox}
              onReady={onRibbonReady}
              className="absolute inset-0"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[10svh] flex flex-col items-center px-6 text-center">
            <p data-hero-eyebrow className="mb-3 text-xs tracking-[0.2em] text-muted-paper uppercase">
              <T value={hero.eyebrow} />
            </p>
            <h1 data-hero-title className="twist-host font-serif text-[clamp(3rem,14vw,4rem)] sm:text-[clamp(2.5rem,min(6vw,9svh),5.75rem)] leading-none tracking-[-0.03em]">
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

          <div className="pointer-events-none absolute inset-x-0 bottom-[13svh] grid place-items-center px-6 text-center">
            {hero.stages.map((stage, i) => (
              <div key={i} data-stage className="col-start-1 row-start-1 opacity-0">
                <TwistText text={stage} split="word" mode="manual" className="text-[1.625rem] leading-[1.25] font-medium tracking-[-0.02em] sm:text-[clamp(1.25rem,2.6vw,2.25rem)] sm:leading-normal" />
              </div>
            ))}
          </div>

          <div data-scroll-cue className="absolute inset-x-0 bottom-7 flex justify-center text-ink">
            <ScrollCue label={hero.scroll} />
          </div>
        </div>

        <div ref={loaderRef} className="pointer-events-none absolute inset-0 text-paper" aria-hidden="true">
          <div ref={line} className="absolute top-1/2 left-1/2 h-px w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
          <p
            data-eye-text
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-[clamp(1.6rem,3.2vw,2.75rem)] text-ink italic opacity-0"
          >
            See the real.
          </p>
          <div data-loader-label className="absolute inset-x-0 bottom-8 flex justify-between px-6 label">
            <span>{brand.name}</span>
            <span>
              <span ref={percent}>000</span>%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
