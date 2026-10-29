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
// Scroll shares of the hero: form the S, hold it, then dive into its band.
const FORM_END = 0.5;
const HOLD_END = 0.66;
const ZOOM_END = 0.97;
// Widest point of the settled band (measured from lib/ribbon: inscribed radius
// 0.104 at the centre), and a zoom that lets it cover any viewport (a wide
// 1920 × 910 window needs about 69×).
const FOCUS = { x: -0.013, y: 0.013 };
const MAX_ZOOM = 90;
// The ribbon's frame: small enough to sit between the title and the captions
// without touching either.
const ribbonBox = (w: number, h: number) => Math.min(w * 0.7, h * 0.56);

// While the page rests at the top, the loose loop slowly leans into a twist and
// eases back, rolling a little right and then left, as if trying it out: a hint
// that scrolling will form it. The twist is driven in shape space, not progress:
// the formation eases with smootherstep and ignores the first stretch of
// progress, so a sine on progress would sit still for half of each cycle and
// then jump. Here the visible amount follows the sine and is mapped back.
const TEASE_AMOUNT = 0.17; // formation amount at the deepest point
const TEASE_SECONDS = 6; // one twist in and out
const TEASE_ROLL = 0.07; // radians; one roll cycle spans two twists

// Inverse of lib/ribbon/sequence.js for the forming stretch: formation amount
// (smootherstep of x) → sequence progress. Constants mirror sequence.js:
// loose hold 0.5 s, then x runs 0→1 over 1.4 s, of a 6.4 s sequence.
function progressForAmount(amount: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const x = (lo + hi) / 2;
    const eased = x * x * x * (x * (x * 6 - 15) + 10);
    if (eased < amount) lo = x;
    else hi = x;
  }
  return (0.5 + 1.4 * lo) / 6.4;
}

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
  const inkFade = useRef<HTMLDivElement>(null);
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
      let stopTease = () => {};

      // Scroll story: the loose loop crosses, twists and settles into the S;
      // then the camera dives into the black band until it becomes the next page.
      const scrollStory = () => {
        const state = { form: 0, zoom: 0 };
        let tease = 0;
        const apply = () => {
          ribbon.current?.setProgress(state.form * S_SETTLED + tease);
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
        // The hint fades out over the first stretch of scroll.
        const startedAt = gsap.ticker.time;
        const teaseTick = (time: number) => {
          const t = Math.max(0, time - startedAt) / TEASE_SECONDS;
          const fade = Math.max(0, 1 - state.form * 6);
          const wave = (1 - Math.cos(2 * Math.PI * t)) / 2;
          // Rolls right during one twist and left during the next.
          ribbon.current?.setLean(TEASE_ROLL * Math.sin(Math.PI * t) * fade);
          const next = wave > 0.0005 ? progressForAmount(TEASE_AMOUNT * wave) * fade : 0;
          if (Math.abs(next - tease) < 1e-5) return;
          tease = next;
          apply();
        };
        gsap.ticker.add(teaseTick);
        stopTease = () => {
          gsap.ticker.remove(teaseTick);
          ribbon.current?.setLean(0);
        };
        return tl;
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
        scrollStory();
        return () => stopTease();
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
              scrollStory();
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
        stopTease();
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
            <h1 data-hero-title className="twist-host font-serif text-[clamp(2.5rem,min(6vw,9svh),5.75rem)] leading-none tracking-[-0.03em]">
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
          <div ref={line} className="absolute top-1/2 left-1/2 h-px w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
          <p
            data-eye-text
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-[clamp(1.6rem,3.2vw,2.75rem)] text-ink italic opacity-0"
          >
            See the real.
          </p>
          <div data-loader-label className="absolute inset-x-0 bottom-8 flex justify-between px-6 label">
            <span>{brand.name}</span>
            <span ref={percent}>000</span>
          </div>
        </div>
      </div>
    </section>
  );
}
