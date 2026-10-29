"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });

export { gsap, ScrollTrigger };

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

// The loader holds the page still until the hero is open.
export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle("is-locked", locked);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The loop aperture is an upright oval with the ribbon's loose-loop proportions.
// Measured from lib/ribbon at progress 0: half-width 0.846, half-height 1.238
// in a frame whose half-height is 1.54 (the orthographic camera).
export const LOOP_RATIO = 1.46;
export const LOOSE_LOOP_RX = 0.846 / 1.54 / 2; // × canvas size
export const LOOSE_LOOP_RY = 1.238 / 1.54 / 2;

// Radius (x) of a LOOP_RATIO oval that just covers a w × h viewport.
export function coverRadius(w: number, h: number) {
  return Math.hypot(w / 2, h / 2 / LOOP_RATIO) * 1.02;
}
