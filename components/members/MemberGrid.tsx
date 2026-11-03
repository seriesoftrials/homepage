"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { T } from "@/components/i18n/T";
import { members, membersPage } from "@/content/site";
import { MemberProfile } from "./MemberProfile";

// Photos are being retaken; each circle shows only its backdrop for now.
const AVATAR =
  "block aspect-square w-full max-w-[9rem] rounded-full bg-[radial-gradient(ellipse_at_50%_18%,#57595e,#303237_48%,#17191c)] shadow-[0_0_0_1px_rgb(255_255_255/0.12)]";

// The founding members four to a row (two on phones), with an open place
// for whoever comes next as the last one, all on view at once. Tapping a
// member opens the profile.
export function MemberGrid() {
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => {
    setSelected(null);
    // Don't leave a focus ring on the photo after closing with Esc.
    (document.activeElement as HTMLElement | null)?.blur();
  }, []);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4">
        {members.map((member, i) => (
          <li key={member.slug}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              className="group flex w-full cursor-pointer flex-col items-center gap-4 text-center outline-none"
            >
              <span className={`${AVATAR} transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:shadow-[0_0_0_2px_#fafafa]`} />
              <span className="flex flex-col items-center gap-1">
                <span className="text-lg font-semibold tracking-[-0.02em]">{member.name}</span>
                <span className="label text-(--muted)">{member.role}</span>
              </span>
            </button>
          </li>
        ))}
        <li>
          <Link href="/join" className="group flex flex-col items-center gap-4 text-center outline-none">
            <span className="grid aspect-square w-full max-w-[9rem] place-items-center rounded-full border border-dashed border-(--muted) text-3xl font-light text-(--muted) transition-colors group-hover:border-(--fg) group-hover:text-(--fg)">
              +
            </span>
            <span className="text-lg font-semibold tracking-[-0.02em] text-(--muted) transition-colors group-hover:text-(--fg)">
              <T value={membersPage.next} />
            </span>
          </Link>
        </li>
      </ul>

      {selected !== null ? <MemberProfile member={members[selected]} onClose={close} /> : null}
    </>
  );
}
