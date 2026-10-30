"use client";

import { useGSAP } from "@gsap/react";
import { useEffect, useRef, type RefObject } from "react";
import { brand } from "@/content/site";
import { gsap, lockScroll, prefersReducedMotion } from "@/lib/motion";

// The loader plays only when "/" itself was loaded by the browser (first visit
// or refresh); LocaleScript flags that, and adds `is-intro` to <html>, before
// first paint. Arriving at home by clicking a link opens straight onto it.
declare global {
  interface Window {
    __serialIntro?: boolean;
  }
}
const MIN_LOADER_SECONDS = 1.4;

// Whether the loader is about to play, so the page can hold its entrance back.
export function introPending() {
  return typeof window !== "undefined" && Boolean(window.__serialIntro) && !prefersReducedMotion();
}

type Props = {
  // The first screen, clipped to the eye as it opens. It needs the `hero-window`
  // class, which keeps it hidden before the loader runs (globals.css).
  target: RefObject<HTMLElement | null>;
  // Adds the page's entrance to the loader's timeline, at `at`, as the eye
  // widens into the full screen.
  onReveal: (tl: gsap.core.Timeline, at: string) => void;
  // The loader has finished and scrolling is free again.
  onDone?: () => void;
};

// Loader, "See the real": a hairline grows across the centre like a closed
// eyelid, by load progress. At 100% the lid flickers, opens into an eye with
// "See the real." inside, and the eye widens until the first screen fills the
// viewport. Place it beside `target` inside the same full-screen box.
export function EyeLoader({ target, onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const callbacks = useRef({ onReveal, onDone });
  useEffect(() => {
    callbacks.current = { onReveal, onDone };
  });

  useGSAP(
    () => {
      const win = target.current;
      const el = root.current;
      if (!win || !el) return;
      const html = document.documentElement;
      if (!introPending()) {
        gsap.set(el, { display: "none" });
        // Reduced motion skips the loader; release what LocaleScript held back.
        window.__serialIntro = false;
        html.classList.remove("is-intro");
        return;
      }

      html.classList.add("is-intro");
      lockScroll(true);
      const items = (selector: string) => el.querySelectorAll(selector);
      const W = innerWidth;
      const H = innerHeight;
      const eyeWidth = Math.min(W * 0.62, 760);
      const eyeOpen = eyeWidth * 0.42; // lid separation at full opening

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
      while (coverScale < 60 && ((eyeOpen * coverScale) / 2) * (1 - (W / (eyeWidth * coverScale)) ** 2) < H / 2) {
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
      let cancelled = false;

      Promise.all([document.fonts.ready, minimum]).then(() => {
        if (cancelled) return;
        creep.kill();
        const tl = gsap
          .timeline({
            onComplete: () => {
              window.__serialIntro = false;
              win.style.clipPath = "none";
              gsap.set(el, { display: "none" });
              lockScroll(false);
              callbacks.current.onDone?.();
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
          // The eye widens until the first screen fills the viewport.
          .addLabel("widen", "open+=1.7")
          .to(items("[data-eye-text]"), { opacity: 0, duration: 0.4 }, "widen")
          .to(eye, { scale: coverScale * 1.05, duration: 1.6, ease: "power3.inOut", onUpdate: drawEye }, "widen")
          .call(() => html.classList.remove("is-intro"), [], "widen+=0.9");
        callbacks.current.onReveal(tl, "widen+=0.7");
      });

      return () => {
        cancelled = true;
        html.classList.remove("is-intro");
        lockScroll(false);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 text-paper" aria-hidden="true">
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
  );
}
