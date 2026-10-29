import type { Localized } from "@/components/i18n/T";
import { TwistText } from "@/components/motion/TwistText";

type Item = { name: Localized | string; text: Localized };

// Numbered rows shared by the values and activities sections.
export function IndexedList({ items }: { items: Item[] }) {
  return (
    <ol className="mx-auto max-w-6xl px-5 pt-6 pb-[40svh] sm:px-8">
      {items.map((item, i) => {
        const name = typeof item.name === "string" ? { ko: item.name, en: item.name } : item.name;
        return (
          <li key={i} className="grid gap-4 border-t border-(--line) py-10 sm:grid-cols-[5rem_1fr_1fr] sm:gap-8 sm:py-14">
            <span className="font-mono text-[11px] tracking-[0.18em] text-(--muted)">{String(i + 1).padStart(2, "0")}</span>
            <TwistText
              as="h3"
              text={name}
              split="word"
              className="font-wide text-[clamp(1.4rem,2.6vw,2.2rem)] leading-[1.1] font-semibold tracking-[-0.01em]"
            />
            <TwistText soft text={item.text} className="text-[15px] leading-[1.75] text-(--muted) sm:pt-1" />
          </li>
        );
      })}
    </ol>
  );
}
