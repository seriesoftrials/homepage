"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { problem } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Follows the hero's dive into the black band, so it opens already in ink.
// The statement stays pinned while its words darken one by one: the page is
// read in place instead of scrolling past.
export function ProblemSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const words = root.current.querySelectorAll("[data-word]");
      gsap
        .timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
        })
        .fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.7 / words.length, duration: 0.08, ease: "none" }, 0.06);
    },
    { scope: root },
  );

  const words = (text: string) =>
    text.split(" ").map((word, i) => (
      <span key={i} data-word>
        {word}{" "}
      </span>
    ));

  return (
    <section ref={root} className="theme-ink relative h-[280svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center px-5 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[clamp(1.75rem,4.2vw,3.75rem)] leading-[1.25] font-medium tracking-[-0.03em]">
            <span lang="ko" className="i18n-ko">
              {words(problem.statement.ko)}
            </span>
            <span lang="en" className="i18n-en">
              {words(problem.statement.en)}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
