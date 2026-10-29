"use client";

import { useEffect } from "react";
import { T } from "@/components/i18n/T";
import { membersPage, type Member } from "@/content/site";
import { lockScroll } from "@/lib/motion";

// A flat card over a dimmed page: role, name, major, quote and links.
// Closes on the backdrop, the close button or Esc.
export function MemberProfile({ member, onClose }: { member: Member; onClose: () => void }) {
  useEffect(() => {
    lockScroll(true);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={member.name}
      className="profile-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 px-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="profile-card theme-ink relative flex w-full max-w-md flex-col items-center rounded-[1.75rem] px-8 pt-10 pb-8 text-center shadow-[0_0_0_1px_#2a2a2a]"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="relative block aspect-square w-28 overflow-hidden rounded-full bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/people/${member.slug}-cutout.webp`}
            alt=""
            className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom grayscale"
          />
        </span>
        <p className="label mt-6 text-(--muted)">{member.role}</p>
        <h2 className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.03em]">{member.name}</h2>
        <p className="mt-2 text-sm text-(--muted)">
          <T value={member.major} />
        </p>
        <p className={`mt-6 font-serif text-[1.35rem] leading-snug italic ${member.quote ? "" : "text-(--muted)"}`}>
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
        <button type="button" onClick={onClose} className="label mt-8 text-(--muted) transition-colors hover:text-(--fg)">
          <T value={membersPage.close} />
        </button>
      </div>
    </div>
  );
}
