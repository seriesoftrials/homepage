"use client";

import { LoopAperture } from "@/components/motion/LoopAperture";
import { TwistText, twistIn } from "@/components/motion/TwistText";
import { reveal } from "@/content/site";

// SERIAL flips in letter by letter, then the hidden letters unfold between
// them: SER·IAL becomes SERies of trIALs.
export function RevealSection() {
  return (
    <LoopAperture
      theme="paper"
      hold={220}
      cover={<Cover />}
      extend={(tl, win) => {
        const mark = win.querySelector("[data-wordmark]");
        const expanders = win.querySelectorAll<HTMLElement>("[data-expander]");
        tl.fromTo(mark, { scale: 1.9 }, { scale: 1, duration: 0.9, ease: "power2.inOut" }, 1.1);
        tl.fromTo(expanders, { width: 0 }, { width: "auto", duration: 0.9, ease: "power2.inOut" }, 1.1);
        twistIn(tl, win.querySelectorAll("[data-expander] [data-twist-item]"), 1.3, 0.04);
        twistIn(tl, win.querySelectorAll("[data-after] [data-twist-item]"), 2.2, 0.08);
      }}
    />
  );
}

function Cover() {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2
        data-wordmark
        aria-label="SERIAL: Series of Trials"
        className="twist-host font-wide text-[clamp(1.6rem,5.6vw,5.5rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
      >
        {reveal.parts.map((part) =>
          part.keep ? (
            <span key={part.text} aria-hidden="true">
              {Array.from(part.text).map((char, i) => (
                <span key={i} data-twist-item>
                  {char}
                </span>
              ))}
            </span>
          ) : (
            <span key={part.text} data-expander data-defer aria-hidden="true" className="inline-block overflow-hidden align-bottom text-(--muted)">
              {Array.from(part.text).map((char, i) => (
                <span key={i} data-twist-item>
                  {char === " " ? " " : char}
                </span>
              ))}
            </span>
          ),
        )}
      </h2>

      <div data-after data-defer className="mt-14 flex flex-col items-center gap-8">
        <div>
          <TwistText as="p" text={{ ko: reveal.slogan, en: reveal.slogan }} split="word" mode="manual" className="font-serif text-[clamp(2rem,4.4vw,4rem)] leading-none italic" />
          <TwistText as="p" text={reveal.sloganSub} mode="manual" className="mt-3 text-sm text-(--muted)" />
        </div>
        <TwistText text={reveal.mobius} mode="manual" className="text-[15px] leading-[1.8] text-(--muted)" />
      </div>
    </div>
  );
}
