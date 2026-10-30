"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { twistIn } from "@/components/motion/TwistText";
import { reveal } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// SERIAL flips in, then the hidden letters unfold between them: SER·IAL
// becomes SERies of trIALs, as on the home page. Plays once, when it scrolls
// into view, and then holds still.
export function NameMark() {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const expanders = el.querySelectorAll<HTMLElement>("[data-expander]");
      gsap.set(expanders, { width: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      twistIn(tl, el.querySelectorAll("[data-kept] [data-twist-item]"), 0, 0.05);
      tl.to(expanders, { width: "auto", duration: 1.1, ease: "power2.inOut" }, 0.6);
      twistIn(tl, el.querySelectorAll("[data-expander] [data-twist-item]"), 0.75, 0.03);
    },
    { scope: ref },
  );

  return (
    <p
      ref={ref}
      aria-label="SERIAL: Series of Trials"
      className="twist-host font-wide text-[clamp(1rem,4.4vw,3.75rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
    >
      {reveal.parts.map((part) => (
        <span
          key={part.text}
          aria-hidden="true"
          {...(part.keep ? { "data-kept": "" } : { "data-expander": "" })}
          className={part.keep ? "" : "inline-block overflow-hidden align-bottom text-(--muted)"}
        >
          {Array.from(part.text).map((char, i) => (
            <span key={i} data-twist-item>
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}
