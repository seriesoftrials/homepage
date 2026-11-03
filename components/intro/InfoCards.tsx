import { T, type Localized } from "@/components/i18n/T";
import { GlassStage } from "@/components/motion/GlassStage";

type Item = { tag: string; title: Localized; text: Localized };

// A grid of glass cards that read in order: a small English tag, a plain
// headline, then a short explanation in dark enough text to read easily.
export function InfoCards({ items, columns = 2 }: { items: Item[]; columns?: 2 | 3 | 4 }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <GlassStage>
      <ul className={`grid gap-4 ${grid}`}>
        {items.map((item) => (
          <li key={item.tag} className="glass-card flex flex-col p-7">
            <span className="label text-(--muted)">{item.tag}</span>
            <h3 className="mt-3 text-[1.3rem] leading-snug font-bold tracking-[-0.025em]">
              <T value={item.title} />
            </h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-(--fg)/70">
              <T value={item.text} />
            </p>
          </li>
        ))}
      </ul>
    </GlassStage>
  );
}
