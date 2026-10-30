"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { TWIST_FROM, TWIST_TO, TwistText, twistIn } from "@/components/motion/TwistText";
import { RibbonCanvas, type RibbonHandle } from "@/components/ribbon/RibbonCanvas";
import { hero } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

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

// The intro page's opening: the loose loop forms into the S as you scroll, its
// captions telling what each stage means, and the camera dives into its black
// band, which becomes the background of the page's contents.
export function IntroHero() {
  const root = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const inkFade = useRef<HTMLDivElement>(null);
  const ribbonWrap = useRef<HTMLDivElement>(null);
  const ribbon = useRef<RibbonHandle>(null);

  useGSAP(
    () => {
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
        gsap.set(captions.at(-1)!, { opacity: 1 });
        return;
      }

      twistIn(gsap.timeline(), titleItems, 0.1, 0.04);
      scrollStory();
      return () => stopTease();
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

      </div>
    </section>
  );
}
