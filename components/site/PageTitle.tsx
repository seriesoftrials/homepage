"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import type { Localized } from "@/components/i18n/T";
import { TwistText, twistIn } from "@/components/motion/TwistText";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Sub-page titles are on screen from the start, so they flip in on arrival
// rather than on scroll. They take a short band under the header, not a
// screen of their own, so the content starts in the first view.
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
    <div ref={ref} className="px-5 pt-32 pb-10 sm:px-8 sm:pt-36">
      {eyebrow ? (
        <p className="mb-5 label text-(--muted)">{eyebrow}</p>
      ) : null}
      <TwistText
        as="h1"
        text={title}
        split="char"
        mode="manual"
        className="font-wide text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-semibold tracking-[-0.02em]"
      />
    </div>
  );
}
