import Link from "next/link";
import { T } from "@/components/i18n/T";
import { TwistText } from "@/components/motion/TwistText";
import { RibbonCanvas } from "@/components/ribbon/RibbonCanvas";
import { join } from "@/content/site";

// The page ends on one dark box on the paper, rather than turning the whole
// screen black: the way in on the left and the S still turning beside it
// (above it on phones), the loop the page began with, now formed.
export function JoinSection() {
  return (
    <section className="theme-paper px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="theme-ink mx-auto flex max-w-6xl flex-col-reverse items-center gap-6 rounded-[2rem] px-8 py-12 text-center sm:flex-row sm:justify-between sm:gap-10 sm:px-14 sm:py-14 sm:text-left">
        <div className="flex flex-col items-center sm:items-start">
          <TwistText
            as="h2"
            text={join.title}
            mode="manual"
            className="text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.045em]"
          />
          <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-(--muted)">
            <T value={join.text} />
          </p>
          <Link
            href="/join"
            className="mt-8 rounded-full bg-(--fg) px-7 py-3.5 text-sm font-medium text-(--bg) transition-[opacity,transform] duration-300 hover:opacity-80 active:scale-95"
          >
            <T value={join.cta} />
          </Link>
        </div>
        <RibbonCanvas spin className="size-[min(44vw,15rem)] shrink-0 sm:size-[min(26vw,17rem)]" />
      </div>
    </section>
  );
}
