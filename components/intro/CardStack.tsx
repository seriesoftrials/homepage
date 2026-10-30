"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { T, type Localized } from "@/components/i18n/T";
import { gsap, prefersReducedMotion } from "@/lib/motion";

type Item = { name: Localized | string; text: Localized };

// Cards pin one after another and stack, each settling a little lower than the
// last, so every card is read while it holds still. A card being covered
// recedes slightly. The folder-tab top echoes a trial on file.
export function CardStack({ items }: { items: Item[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const slots = gsap.utils.toArray<HTMLElement>("[data-slot]", root.current);
      // Cards stay opaque (a translucent card would show the one beneath); a veil
      // in the section colour dims the receding card instead.
      slots.slice(0, -1).forEach((slot, i) => {
        const scrollTrigger = { trigger: slots[i + 1], start: "top bottom", end: "top 25%", scrub: 0.6 };
        gsap.to(slot.querySelector("[data-card]"), { scale: 0.94, ease: "none", scrollTrigger });
        gsap.to(slot.querySelector("[data-veil]"), { opacity: 0.6, ease: "none", scrollTrigger });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto max-w-5xl px-5 pb-[45svh] sm:px-8">
      {items.map((item, i) => {
        const name = typeof item.name === "string" ? { ko: item.name, en: item.name } : item.name;
        const number = String(i + 1).padStart(2, "0");
        return (
          <div key={i} data-slot className="sticky h-[72svh]" style={{ top: `calc(18svh + ${i * 1.25}rem)` }}>
            <article data-card className="relative origin-top">
              <div data-veil aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-(--bg) opacity-0" />
              <div className="flex">
                <span className="card-tab rounded-t-2xl px-5 pt-3 pb-2 label">
                  {number}
                </span>
              </div>
              <div className="card-body grid min-h-[min(42svh,24rem)] gap-8 rounded-tr-[1.75rem] rounded-b-[1.75rem] p-7 sm:grid-cols-[1fr_1.1fr] sm:p-12">
                <div className="flex flex-col justify-between gap-6">
                  <span className="font-serif text-[clamp(4.5rem,11vw,9rem)] leading-[0.8] italic opacity-25">{number}</span>
                  <h3 className="font-wide text-[clamp(1.6rem,3.2vw,2.75rem)] leading-[1.05] font-semibold tracking-[-0.01em]">
                    <T value={name} />
                  </h3>
                </div>
                <p className="self-end text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.7] text-(--muted)">
                  <T value={item.text} />
                </p>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
