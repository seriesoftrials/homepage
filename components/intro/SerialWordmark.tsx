"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Seconds the full name stays, the letters' fade, the gap closing or
// opening, and how long SERIAL stays. The full name holds the longest.
const FULL_SECONDS = 4.5;
const FADE_SECONDS = 0.4;
const CLOSE_SECONDS = 0.8;
const SHORT_SECONDS = 1.4;

// SERIES OF TRIALS, folding into SERIAL and back. The hidden letters fade
// out completely before their gap closes, and the gap opens before they
// fade back in, so no letter is ever seen cut off by the closing edge. It
// starts on the full name.
export function SerialWordmark() {
  const root = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const expanders = root.current.querySelectorAll("[data-expander]");
      gsap
        .timeline({ repeat: -1, delay: FULL_SECONDS })
        .to(expanders, { opacity: 0, duration: FADE_SECONDS, ease: "power1.out" })
        .to(expanders, { width: 0, duration: CLOSE_SECONDS, ease: "power3.inOut" })
        .to(expanders, { width: "auto", duration: CLOSE_SECONDS, ease: "power3.inOut" }, `+=${SHORT_SECONDS}`)
        .to(expanders, { opacity: 1, duration: FADE_SECONDS * 1.5, ease: "power1.in" })
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
          <span key={part.text} data-expander aria-hidden="true" className="inline-block overflow-hidden align-bottom text-(--muted)">
            {part.text.replace(/ /g, "\u00a0")}
          </span>
        ),
      )}
    </p>
  );
}
