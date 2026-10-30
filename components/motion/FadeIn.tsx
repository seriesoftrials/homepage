"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

// Content that rises a little into place the first time it scrolls into view,
// then stays put, so what has been read never moves or disappears. `stagger`
// lets direct children arrive one after another instead.
export function FadeIn({
  children,
  className = "",
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      gsap.from(stagger ? el.children : el, {
        opacity: 0,
        y: 16,
        duration: 0.9,
        ease: "power2.out",
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
