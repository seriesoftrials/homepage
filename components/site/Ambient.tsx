"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Film grain over everything, and a faint light that trails the pointer.
// Difference blending lets the same light read on paper and on ink.
export function Ambient() {
  const glow = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = glow.current;
    if (!el || prefersReducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const x = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      x(event.clientX);
      y(event.clientY);
      el.style.opacity = "1";
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  });

  return (
    <>
      <div
        ref={glow}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-30 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 mix-blend-difference transition-opacity duration-700"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 38%, transparent 70%)" }}
      />
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-[60]" />
    </>
  );
}
