import Link from "next/link";
import { T } from "@/components/i18n/T";
import { SectionCover } from "@/components/motion/SectionCover";
import { RibbonCanvas } from "@/components/ribbon/RibbonCanvas";
import { SiteFooter } from "@/components/site/SiteFooter";
import { join } from "@/content/site";

// The page ends on one ink screen: the S still turning, the loop the page
// began with, now formed, and the way in. The footer sits inside it.
export function JoinSection() {
  return (
    <section className="theme-ink relative flex min-h-svh flex-col items-center justify-center px-6 pt-16 pb-32 sm:pb-24">
      <RibbonCanvas spin className="mb-4 h-[min(34svh,60vw)] w-[min(34svh,60vw)]" />
      <SectionCover title={join.title} />
      <p className="mt-6 max-w-md text-center text-[15px] leading-[1.7] text-(--muted)">
        <T value={join.text} />
      </p>
      <Link
        href="/join"
        className="mt-10 rounded-full bg-(--fg) px-7 py-3.5 text-sm font-medium text-(--bg) transition-opacity hover:opacity-80"
      >
        <T value={join.cta} />
      </Link>
      <SiteFooter inline />
    </section>
  );
}
