"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/components/i18n/T";
import { members, membersPage } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { MemberProfile } from "./MemberProfile";
import { asset } from "@/lib/asset";

// Vertical distance between members, as a share of the viewport height.
const GAP_SVH = 0.42;
// Members alternate between these horizontal positions (share of the width).
const LEFT = 0.27;
const RIGHT = 0.73;
// Node diameter, matching the w-[clamp(104px,12vw,168px)] avatars.
const nodeSize = () => Math.min(168, Math.max(104, innerWidth * 0.12));
// Remembered once a visitor has opened any profile; the hover hint then stops.
// Kept as a class on <html> (see globals.css), not React state.
const HINT_KEY = "serial-member-hint-seen";
const HINT_CLASS = "member-hint-seen";

type Point = { x: number; y: number };

// One thin line, like the hairline of the logo, runs down the page and links
// the founding members in turn: the series of people who started SERIAL. It is
// drawn as you scroll, each member appears as the line reaches them, and it
// ends at an open place for whoever comes next.
export function MemberThread() {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ width: 0, gap: 0, node: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => {
    setSelected(null);
    // Don't leave a focus ring on the photo after closing with Esc.
    (document.activeElement as HTMLElement | null)?.blur();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY) === "1") document.documentElement.classList.add(HINT_CLASS);
    } catch {}
  }, []);

  const open = (index: number) => {
    setSelected(index);
    document.documentElement.classList.add(HINT_CLASS);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {}
  };

  const count = members.length + 1; // members, then the open place
  const points: Point[] = Array.from({ length: count }, (_, i) => ({
    x: size.width * (i % 2 === 0 ? LEFT : RIGHT),
    y: size.gap * (i + 0.5),
  }));
  const height = size.gap * count;
  // Nodes sit with the centre of their circle on the line, labels hanging below.
  // The offset lives on an outer wrapper; GSAP's reveal animates the inner node,
  // so it can never overwrite the placement.
  const place = (p: Point) => ({ left: p.x, top: p.y, transform: `translate(-50%, ${-size.node / 2}px)` });

  // Measure the column; the curve and positions follow its width.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, gap: innerHeight * GAP_SVH, node: nodeSize() });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth S-bends: leave each point straight down, arrive at the next straight down.
  const d = points.length
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${size.width / 2} 0 C ${size.width / 2} ${p.y * 0.6} ${p.x} ${p.y * 0.4} ${p.x} ${p.y}`;
        const prev = points[i - 1];
        // The last bend stops on the rim of the open place, not at its centre.
        const end = i === points.length - 1 ? p.y - size.node / 2 : p.y;
        const mid = (end - prev.y) / 2;
        return `${acc} C ${prev.x} ${prev.y + mid} ${p.x} ${end - mid} ${p.x} ${end}`;
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
          // Finishes as the last circle's rim reaches the same line on screen,
          // so the drawing ends on the rim even at the bottom of the page.
          scrollTrigger: {
            trigger: root.current,
            start: "top 62%",
            end: `bottom-=${size.gap / 2 + size.node / 2} 62%`,
            scrub: 0.6,
          },
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
    { scope: root, dependencies: [size.width, size.gap, size.node] },
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
            <div key={member.slug} className="absolute" style={place(points[i])}>
              <button
                type="button"
                data-node
                onClick={() => open(i)}
                className="thread-node group relative flex flex-col items-center gap-3 text-center outline-none"
              >
                <span className="relative block aspect-square w-[clamp(104px,12vw,168px)] overflow-hidden rounded-full bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)] shadow-[0_0_0_1px_rgb(255_255_255/0.12)] transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:shadow-[0_0_0_2px_#fafafa]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(`/people/${member.slug}-cutout.webp`)}
                    alt=""
                    draggable={false}
                    className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom grayscale"
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="thread-hint pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-2 text-[12px] whitespace-nowrap opacity-0 transition-all duration-300 group-hover:-top-14 group-hover:opacity-100"
                >
                  <T value={membersPage.hint} />
                </span>
                <span className="flex flex-col items-center gap-1">
                  <span className="text-lg font-semibold tracking-[-0.02em]">{member.name}</span>
                  <span className="label text-(--muted)">{member.role}</span>
                </span>
              </button>
            </div>
          ))
        : null}

      {size.width ? (
        <div className="absolute" style={place(points[members.length])}>
          <Link href="/join" data-node className="group flex flex-col items-center gap-3 text-center outline-none">
            <span className="grid aspect-square w-[clamp(104px,12vw,168px)] place-items-center rounded-full border border-dashed border-(--muted) text-3xl font-light text-(--muted) transition-colors group-hover:border-(--fg) group-hover:text-(--fg)">
              +
            </span>
            <span className="text-lg font-semibold tracking-[-0.02em] text-(--muted) transition-colors group-hover:text-(--fg)">
              <T value={membersPage.next} />
            </span>
          </Link>
        </div>
      ) : null}

      {selected !== null ? <MemberProfile member={members[selected]} onClose={close} /> : null}
    </div>
  );
}
