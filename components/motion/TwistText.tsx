"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ElementType } from "react";
import type { Localized } from "@/components/i18n/T";
import { gsap, prefersReducedMotion } from "@/lib/motion";

type Split = "line" | "word" | "char";

type Props = {
  text: Localized<string | string[]>;
  split?: Split;
  as?: ElementType;
  className?: string;
  // "manual" renders the markup only; a parent timeline animates it with twistIn().
  mode?: "scroll" | "manual";
  start?: string;
  end?: string;
  // Paragraphs tilt less than headlines so long text never feels like it spins.
  soft?: boolean;
};

// A half turn of the ribbon, applied to type: each piece flips up from behind.
export const TWIST_FROM = { rotationX: -100, yPercent: 35, opacity: 0 };
export const TWIST_TO = { rotationX: 0, yPercent: 0, opacity: 1, ease: "power2.out" };
const SOFT_FROM = { rotationX: -35, yPercent: 12, opacity: 0 };

export function twistIn(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  position: gsap.Position = 0,
  stagger = 0.06,
) {
  return tl.fromTo(targets, TWIST_FROM, { ...TWIST_TO, stagger, duration: 0.5 }, position);
}

function pieces(line: string, split: Split) {
  if (split === "line") return [line];
  if (split === "word") return line.split(" ");
  return Array.from(line);
}

function Variant({ lang, lines, split }: { lang: "ko" | "en"; lines: string[]; split: Split }) {
  return (
    <span lang={lang} className={`i18n-${lang} block`}>
      {lines.map((line, i) => (
        <span key={i} data-twist-line aria-hidden="true">
          {pieces(line, split).map((piece, j, all) => (
            <span key={j}>
              <span data-twist-item>{piece === " " ? " " : piece}</span>
              {split === "word" && j < all.length - 1 ? " " : null}
            </span>
          ))}
        </span>
      ))}
      <span className="sr-only">{lines.join(" ")}</span>
    </span>
  );
}

export function TwistText({
  text,
  split = "line",
  as: Tag = "div",
  className = "",
  mode = "scroll",
  start = "top 88%",
  end = "top 45%",
  soft = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const toLines = (v: string | string[]) => (Array.isArray(v) ? v : [v]);

  useGSAP(
    () => {
      if (mode !== "scroll" || prefersReducedMotion() || !ref.current) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start, end, scrub: 0.6 },
      });
      const items = ref.current.querySelectorAll("[data-twist-item]");
      if (soft) tl.fromTo(items, SOFT_FROM, { ...TWIST_TO, stagger: 0.08, duration: 0.5 });
      else twistIn(tl, items, 0, split === "char" ? 0.03 : 0.08);
    },
    { scope: ref, dependencies: [mode, start, end, split, soft] },
  );

  return (
    <Tag ref={ref} className={`twist-host ${className}`}>
      <Variant lang="ko" lines={toLines(text.ko)} split={split} />
      <Variant lang="en" lines={toLines(text.en)} split={split} />
    </Tag>
  );
}
