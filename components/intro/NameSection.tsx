import { LoopAperture } from "@/components/motion/LoopAperture";
import { TwistText } from "@/components/motion/TwistText";
import { reveal } from "@/content/site";

// The answer to the problem: the name. SER·IAL stand out inside Series of
// Trials (the home page unfolds them), with the slogan and what the Möbius
// strip in the logo stands for, flipping in as the arch rises.
export function NameSection() {
  return (
    <LoopAperture
      theme="paper"
      cover={
        <div className="flex w-full flex-col items-center text-center">
          <p
            aria-label="SERIAL: Series of Trials"
            className="font-wide text-[clamp(1rem,5.6vw,5.5rem)] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap"
          >
            {reveal.parts.map((part) => (
              <span key={part.text} aria-hidden="true" className={part.keep ? "" : "text-(--muted)"}>
                {part.text}
              </span>
            ))}
          </p>
          <div className="mt-14 flex flex-col items-center gap-8">
            <div>
              <TwistText as="p" text={{ ko: reveal.slogan, en: reveal.slogan }} split="word" mode="manual" className="font-serif text-[clamp(2rem,4.4vw,4rem)] leading-none italic" />
              <TwistText as="p" text={reveal.sloganSub} mode="manual" className="mt-3 text-sm text-(--muted)" />
            </div>
            <TwistText text={reveal.mobius} mode="manual" className="text-[15px] leading-[1.8] text-(--muted)" />
          </div>
        </div>
      }
    />
  );
}
