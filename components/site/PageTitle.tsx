"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import type { Localized } from "@/components/i18n/T";
import { TwistText, twistIn } from "@/components/motion/TwistText";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Sub-page titles are on screen from the start, so they flip in on arrival
// (after the page's arch has risen) rather than on scroll.
export function PageTitle({ title, eyebrow }: { title: Localized; eyebrow?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      twistIn(gsap.timeline({ delay: 0.45 }), ref.current.querySelectorAll("[data-twist-item]"), 0, 0.05);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="px-5 pt-[24svh] pb-16 sm:px-8">
      {eyebrow ? (
        <p className="mb-5 label text-(--muted)">{eyebrow}</p>
      ) : null}
      <TwistText
        as="h1"
        text={title}
        split="char"
        mode="manual"
        className="font-wide text-[clamp(3rem,11vw,10rem)] leading-[0.95] font-semibold tracking-[-0.02em]"
      />
    </div>
  );
}
