import type { ReactNode } from "react";
import { T, type Localized } from "@/components/i18n/T";

type Props = {
  title: Localized;
  lead?: Localized;
  children: ReactNode;
};

// One part of the intro page: a plain title saying what the part is for
// and an optional lead line, with the content below, all still.
export function IntroSection({ title, lead, children }: Props) {
  return (
    <section className="border-t border-(--line) px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.1] font-semibold tracking-[-0.04em]">
          <T value={title} />
        </h2>
        {lead ? (
          <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-(--muted)">
            <T value={lead} />
          </p>
        ) : null}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
