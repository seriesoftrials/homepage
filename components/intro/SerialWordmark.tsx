"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Seconds the full name stays, the pull in or out, and how long SERIAL
// stays. The full name holds the longest.
const FULL_SECONDS = 4.5;
const PULL_SECONDS = 1;
const SHORT_SECONDS = 1.4;

// SERIES OF TRIALS, folding into SERIAL and back. Each hidden run of letters
// is pulled sideways into the letters before it: its gap closes while the
// letters inside slide left by the same amount, on the same ease, so their
// right edge stays on the closing edge and nothing is cropped there. They
// slip under the letters before them through a soft edge (--edge, only
// while moving) and fade on the way. It starts on the full name.
export function SerialWordmark() {
  const root = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const gaps = root.current.querySelectorAll("[data-expander]");
      const runs = root.current.querySelectorAll("[data-run]");
      const pull = { duration: PULL_SECONDS, ease: "power3.inOut" };
      const fade = { duration: PULL_SECONDS };
      gsap
        .timeline({ repeat: -1, delay: FULL_SECONDS })
        .addLabel("in")
        .set(gaps, { "--edge": "0.5em" }, "in")
        .to(gaps, { width: 0, ...pull }, "in")
        .to(runs, { xPercent: -100, ...pull }, "in")
        .to(runs, { opacity: 0, ...fade, ease: "power2.in" }, "in")
        .addLabel("out", `+=${SHORT_SECONDS}`)
        .to(gaps, { width: "auto", ...pull }, "out")
        .to(runs, { xPercent: 0, ...pull }, "out")
        .to(runs, { opacity: 1, ...fade, ease: "power2.out" }, "out")
        .set(gaps, { "--edge": "0em" })
        .to({}, { duration: FULL_SECONDS });
    },
    { scope: root },
  );

  return (
    <p
      ref={root}
      aria-label="SERIAL: Series of Trials"
      className="font-wide text-[clamp(1.5rem,6.2vw,5.5rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
    >
      {reveal.parts.map((part) =>
        part.keep ? (
          <span key={part.text} aria-hidden="true">
            {part.text}
          </span>
        ) : (
          <span
            key={part.text}
            data-expander
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom text-(--muted) [mask-image:linear-gradient(90deg,transparent,#000_var(--edge,0em))]"
          >
            <span data-run className="inline-block will-change-transform">
              {part.text.replace(/ /g, "\u00a0")}
            </span>
          </span>
        ),
      )}
    </p>
  );
}
