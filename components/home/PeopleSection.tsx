"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { T } from "@/components/i18n/T";
import { MemberCard } from "@/components/members/MemberCard";
import { LoopAperture } from "@/components/motion/LoopAperture";
import { TrialCover } from "@/components/motion/TrialCover";
import { members, people } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export function PeopleSection() {
  const track = useRef<HTMLDivElement>(null);

  // The row drifts sideways while the page scrolls down, one member after another.
  useGSAP(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { x: () => innerWidth * 0.15 },
      {
        x: () => Math.min(0, innerWidth - el.scrollWidth - innerWidth * 0.05),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
      },
    );
  });

  return (
    <LoopAperture theme="ink" cover={<TrialCover trial={people.trial} title={people.title} />}>
      <div className="overflow-hidden pt-6 pb-16">
        <div ref={track} className="flex w-max gap-6 px-5 sm:gap-10 sm:px-8">
          {members.map((member) => (
            <MemberCard key={member.slug} member={member} className="w-[62vw] sm:w-[26vw] lg:w-[19vw]" />
          ))}
        </div>
      </div>
      <div className="flex justify-center pb-[40svh]">
        <Link href="/members" className="rounded-full border border-(--fg) px-6 py-3 text-sm transition-colors hover:bg-(--fg) hover:text-(--bg)">
          <T value={people.cta} />
        </Link>
      </div>
    </LoopAperture>
  );
}
