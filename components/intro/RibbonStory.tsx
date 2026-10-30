"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { RibbonCanvas, type RibbonHandle } from "@/components/ribbon/RibbonCanvas";
import { hero } from "@/content/site";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

// Ribbon sequence keyframe (lib/ribbon/sequence.js KEYFRAMES.s): the S settles.
const S_SETTLED = 0.297;

// The ribbon forms with the reading: a loose loop, a crossing, a twist, the S.
// Each line of the story goes with one of those shapes; scrolling past a line
// lights it and moves the ribbon on to its shape. The lines are ordinary text
// that stays where it is, so what has been read remains on the page. The
// ribbon holds still beside them (above them on phones).
export function RibbonStory() {
  const root = useRef<HTMLDivElement>(null);
  const ribbon = useRef<RibbonHandle>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]", el);
      if (prefersReducedMotion()) {
        ribbon.current?.setProgress(S_SETTLED);
        return;
      }
      const state = { form: 0 };
      gsap.to(state, {
        form: 1,
        ease: "none",
        onUpdate: () => ribbon.current?.setProgress(state.form * S_SETTLED),
        scrollTrigger: { trigger: el.querySelector("[data-steps]"), start: "top 55%", end: "bottom 55%", scrub: 0.8 },
      });
      // A line lights up when it reaches the middle and stays lit once read.
      steps.forEach((step) =>
        ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          onEnter: () => step.classList.add("is-read"),
          onLeaveBack: () => step.classList.remove("is-read"),
        }),
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="sticky top-14 z-10 bg-(--bg) lg:order-2 lg:top-28 lg:self-start lg:bg-transparent">
        <div className="relative mx-auto aspect-square h-[34svh] lg:h-auto lg:max-h-[min(70svh,34rem)] lg:w-full">
          <RibbonCanvas ref={ribbon} idle poster={false} material="satin" interactive className="absolute inset-0" />
        </div>
      </div>
      <ol data-steps className="lg:order-1">
        {hero.stages.map((stage, i) => (
          <li
            key={i}
            data-step
            className="story-step flex min-h-[38svh] items-center text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.3] font-medium tracking-[-0.02em]"
          >
            <T value={stage} />
          </li>
        ))}
      </ol>
    </div>
  );
}
