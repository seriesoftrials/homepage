"use client";

import { useEffect, useRef } from "react";
import { ScrollCue } from "@/components/motion/ScrollCue";
import { hero } from "@/content/site";

// The home page's scroll cue, reused on long sub-pages without its label: it
// waits at the foot of the first screen and fades once the visitor scrolls.
// Difference blending keeps it legible on paper and ink alike, like the header.
export function PageScrollCue() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.classList.toggle("is-hidden", scrollY > 40);
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={ref}
      className="page-scroll-cue pointer-events-none fixed inset-x-0 bottom-7 z-40 flex justify-center text-white mix-blend-difference"
    >
      <ScrollCue label={hero.scroll} showLabel={false} />
    </div>
  );
}
