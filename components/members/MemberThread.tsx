"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/components/i18n/T";
import { members, membersPage } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { MemberProfile } from "./MemberProfile";

// Vertical distance between members, as a share of the viewport height.
const GAP_SVH = 0.42;
// Members alternate between these horizontal positions (share of the width).
const LEFT = 0.27;
const RIGHT = 0.73;

type Point = { x: number; y: number };

// One thin line, like the hairline of the logo, runs down the page and links
// the founding members in turn: the series of people who started SERIAL. It is
// drawn as you scroll, each member appears as the line reaches them, and it
// ends at an open place for whoever comes next.
export function MemberThread() {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ width: 0, gap: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const count = members.length + 1; // members, then the open place
  const points: Point[] = Array.from({ length: count }, (_, i) => ({
    x: size.width * (i % 2 === 0 ? LEFT : RIGHT),
    y: size.gap * (i + 0.5),
  }));
  const height = size.gap * count;

  // Measure the column; the curve and positions follow its width.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, gap: innerHeight * GAP_SVH });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth S-bends: leave each point straight down, arrive at the next straight down.
  const d = points.length
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${size.width / 2} 0 C ${size.width / 2} ${p.y * 0.6} ${p.x} ${p.y * 0.4} ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const mid = (p.y - prev.y) / 2;
        return `${acc} C ${prev.x} ${prev.y + mid} ${p.x} ${p.y - mid} ${p.x} ${p.y}`;
      }, "")
    : "";

  useGSAP(
    () => {
      const line = path.current;
      if (!line || !size.width) return;
      const nodes = gsap.utils.toArray<HTMLElement>("[data-node]", root.current);
      if (prefersReducedMotion()) return;
      const length = line.getTotalLength();
      line.style.strokeDasharray = `${length}`;
      gsap.fromTo(
        line,
        { strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 62%", end: "bottom 62%", scrub: 0.6 },
        },
      );
      // Each member surfaces as the line reaches them.
      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 24, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: node, start: "top 78%", end: "top 52%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: root, dependencies: [size.width, size.gap] },
  );

  return (
    <div ref={root} className="relative mx-auto w-full max-w-5xl px-5 sm:px-8" style={{ height: height || "100svh" }}>
      {size.width ? (
        <svg aria-hidden="true" width={size.width} height={height} className="pointer-events-none absolute top-0 left-0 overflow-visible">
          <path ref={path} d={d} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.25" />
        </svg>
      ) : null}

      {size.width
        ? members.map((member, i) => (
            <button
              key={member.slug}
              type="button"
              data-node
              onClick={() => setSelected(i)}
              className="thread-node group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-center"
              style={{ left: points[i].x, top: points[i].y }}
            >
              <span className="relative block aspect-square w-[clamp(104px,12vw,168px)] overflow-hidden rounded-full bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)] shadow-[0_0_0_1px_rgb(255_255_255/0.12)] transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/people/${member.slug}-cutout.webp`}
                  alt=""
                  draggable={false}
                  className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom grayscale"
                />
              </span>
              <span className="flex flex-col items-center gap-1">
                <span className="text-lg font-semibold tracking-[-0.02em]">{member.name}</span>
                <span className="label text-(--muted)">{member.role}</span>
              </span>
            </button>
          ))
        : null}

      {size.width ? (
        <Link
          href="/join"
          data-node
          className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-center"
          style={{ left: points[members.length].x, top: points[members.length].y }}
        >
          <span className="grid aspect-square w-[clamp(104px,12vw,168px)] place-items-center rounded-full border border-dashed border-(--muted) text-3xl font-light text-(--muted) transition-colors group-hover:border-(--fg) group-hover:text-(--fg)">
            +
          </span>
          <span className="text-lg font-semibold tracking-[-0.02em] text-(--muted) transition-colors group-hover:text-(--fg)">
            <T value={membersPage.next} />
          </span>
        </Link>
      ) : null}

      {selected !== null ? <MemberProfile member={members[selected]} onClose={close} /> : null}
    </div>
  );
}
