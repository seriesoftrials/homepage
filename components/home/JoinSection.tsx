"use client";

import Link from "next/link";
import { T } from "@/components/i18n/T";
import { LoopAperture } from "@/components/motion/LoopAperture";
import { SectionCover } from "@/components/motion/SectionCover";
import { RibbonCanvas } from "@/components/ribbon/RibbonCanvas";
import { SiteFooter } from "@/components/site/SiteFooter";
import { join } from "@/content/site";

// The last arch rises onto the S still turning: the loop the page began with,
// now formed, and the series continues.
export function JoinSection() {
  return (
    <LoopAperture
      theme="ink"
      cover={
        // Raised on phones to leave room for the footer row below.
        <div className="flex flex-col items-center pb-24 sm:pb-0">
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
        </div>
      }
    />
  );
}
