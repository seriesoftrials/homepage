"use client";

import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import { T } from "@/components/i18n/T";
import { members, membersPage, type Member } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const TAU = Math.PI * 2;
const STEP = TAU / members.length;
// The front of the orbit is its lowest point; members there are nearest.
const FRONT = Math.PI / 2;
const REVOLUTION_SECONDS = 70;
// The orbit is a tilted loop: flatter than the brand oval, as if seen from above,
// yet tall enough inside for the profile that opens at its centre.
const TILT = 0.42;

// Members revolve on a tilted loop around the page's centre. Depth comes from
// position alone: front members are larger, sharper and on top. Hovering slows
// the orbit; selecting a member turns it to the front and opens a profile in
// the centre.
export function MemberOrbit() {
  const root = useRef<HTMLElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const orbit = useRef({ base: -FRONT, speed: TAU / REVOLUTION_SECONDS, target: TAU / REVOLUTION_SECONDS });
  const [selected, setSelected] = useState<number | null>(null);
  const [radius, setRadius] = useState({ x: 520, y: 520 * TILT });

  // Size the orbit to the viewport.
  useEffect(() => {
    const resize = () => {
      const x = Math.min(innerWidth * 0.4, 600);
      // Narrow screens stand the orbit up so the centre still has room.
      const y = innerWidth < 640 ? innerHeight * 0.3 : Math.min(Math.max(x * TILT, innerHeight * 0.2), innerHeight * 0.32);
      setRadius({ x, y });
    };
    resize();
    addEventListener("resize", resize);
    return () => removeEventListener("resize", resize);
  }, []);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      const tick = (_time: number, deltaMs: number) => {
        const o = orbit.current;
        const dt = Math.min(deltaMs, 50) / 1000;
        // Speed eases toward its target so slowing and resuming never jolt.
        o.speed += (o.target - o.speed) * (1 - Math.exp(-dt * 3));
        if (!reduced) o.base += o.speed * dt;
        items.current.forEach((el, i) => {
          if (!el) return;
          const angle = o.base + i * STEP;
          const depth = (Math.sin(angle) + 1) / 2; // 0 back … 1 front
          const x = Math.cos(angle) * radius.x;
          const y = Math.sin(angle) * radius.y;
          const scale = 0.55 + 0.45 * depth;
          el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
          el.style.zIndex = String(Math.round(depth * 100));
          el.style.setProperty("--depth", depth.toFixed(3));
        });
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { dependencies: [radius], scope: root },
  );

  const select = (index: number | null) => {
    const o = orbit.current;
    setSelected(index);
    if (index === null) {
      o.target = TAU / REVOLUTION_SECONDS;
      return;
    }
    // Stop, then turn the shortest way until this member is at the front.
    o.target = 0;
    o.speed = 0;
    const goal = FRONT - index * STEP;
    const delta = ((((goal - o.base) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
    gsap.to(o, { base: o.base + delta, duration: 1.2, ease: "power3.inOut", overwrite: true });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && select(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const member = selected === null ? null : members[selected];

  return (
    <section
      ref={root}
      className="relative h-svh min-h-[620px] overflow-hidden"
      aria-label="SERIAL members"
    >
      {/* The orbit line, faint, like the loop it echoes. */}
      <svg
        aria-hidden="true"
        width={radius.x * 2 + 2}
        height={radius.y * 2 + 2}
        className="pointer-events-none absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <ellipse cx={radius.x + 1} cy={radius.y + 1} rx={radius.x} ry={radius.y} fill="none" stroke="currentColor" strokeOpacity="0.14" />
      </svg>

      <div className="absolute top-[52%] left-1/2 h-0 w-0">
        {members.map((m, i) => (
          <button
            key={m.slug}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            aria-pressed={selected === i}
            aria-label={m.name}
            onClick={() => select(selected === i ? null : i)}
            onPointerEnter={() => selected === null && (orbit.current.target = TAU / REVOLUTION_SECONDS / 6)}
            onPointerLeave={() => selected === null && (orbit.current.target = TAU / REVOLUTION_SECONDS)}
            className="orbit-member absolute top-0 left-0 flex flex-col items-center gap-3 will-change-transform"
            data-dim={selected !== null && selected !== i ? "" : undefined}
          >
            <span className="relative block aspect-square w-[clamp(84px,9vw,136px)] overflow-hidden rounded-full bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)] ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/people/${m.slug}-cutout.webp`}
                alt=""
                draggable={false}
                className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom grayscale"
              />
            </span>
            <span className="orbit-member__name text-[13px] font-medium whitespace-nowrap">{m.name}</span>
          </button>
        ))}
      </div>

      {/* z-50 sits between the back half of the orbit (z < 50) and the front. */}
      <div className="pointer-events-none absolute inset-x-0 top-[52%] z-50 flex -translate-y-1/2 justify-center px-6 text-center">
        {member ? <Profile key={member.slug} member={member} onClose={() => select(null)} /> : <Intro />}
      </div>
    </section>
  );
}

function Intro() {
  return (
    <div className="orbit-panel flex flex-col items-center">
      <p className="label text-(--muted)">Founding members</p>
      <h1 className="mt-4 font-wide text-[clamp(2.5rem,6vw,5rem)] leading-none font-semibold tracking-[-0.02em]">
        <T value={membersPage.title} />
      </h1>
      <p className="mt-4 text-sm text-(--muted)">
        <T value={membersPage.hint} />
      </p>
    </div>
  );
}

function Profile({ member, onClose }: { member: Member; onClose: () => void }) {
  return (
    <div className="orbit-panel pointer-events-auto flex max-w-md flex-col items-center">
      <p className="label text-(--muted)">{member.role}</p>
      <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)] leading-none font-semibold tracking-[-0.03em]">{member.name}</h2>
      <p className="mt-3 text-sm text-(--muted)">
        <T value={member.major} />
      </p>
      <p className={`mt-6 font-serif text-[clamp(1.15rem,1.8vw,1.5rem)] leading-snug italic ${member.quote ? "" : "text-(--muted)"}`}>
        <T value={member.quote ?? membersPage.quotePlaceholder} />
      </p>
      {member.links?.length ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {member.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-2 text-[12px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-colors hover:bg-paper hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={onClose} className="label mt-7 text-(--muted) transition-colors hover:text-(--fg)">
        <T value={membersPage.close} />
      </button>
    </div>
  );
}
