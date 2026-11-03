"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// How far the pointer pulls the shapes, as a share of the way toward it
// covered per frame: small, so they drift after it slowly.
const FOLLOW = 0.025;

// What glass cards frost: a few soft, blurred grey shapes behind them that
// slowly ripple and change shape (globals.css, .glass-blob), and lean a
// little toward the pointer, each by its own depth. Wrap the cards in it.
export function GlassStage({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let raf = 0;
    const tick = () => {
      now.x += (target.x - now.x) * FOLLOW;
      now.y += (target.y - now.y) * FOLLOW;
      el.style.setProperty("--px", now.x.toFixed(4));
      el.style.setProperty("--py", now.y.toFixed(4));
      raf = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      // -1 to 1 across the stage, held at the edges beyond it.
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      target.x = clamp(((event.clientX - box.left) / box.width) * 2 - 1);
      target.y = clamp(((event.clientY - box.top) / box.height) * 2 - 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`glass-stage ${className}`}>
      <div aria-hidden="true" className="glass-stage__blobs">
        <span className="glass-blob glass-blob--a">
          <span />
        </span>
        <span className="glass-blob glass-blob--b">
          <span />
        </span>
        <span className="glass-blob glass-blob--c">
          <span />
        </span>
      </div>
      {children}
    </div>
  );
}
