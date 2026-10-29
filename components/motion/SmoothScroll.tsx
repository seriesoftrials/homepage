"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, getLenis, ScrollTrigger, prefersReducedMotion, setLenis } from "@/lib/motion";

// Lenis eases the native scroll position (lerp), and GSAP's ticker drives it,
// so every ScrollTrigger reads the same smoothed value on the same frame.
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // A wheel notch travels about 0.6× its native distance, as on casadisolare.com
    // (0.55× on Windows), so content moves at reading pace.
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.6, autoRaf: false });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
