import type { ReactNode } from "react";
import { T, TLines, type Localized } from "@/components/i18n/T";
import { FadeIn } from "@/components/motion/FadeIn";
import { activities, introPage, problem, reveal, values } from "@/content/site";
import { IntroContents } from "./IntroContents";
import { NameMark } from "./NameMark";

// Where the hero's dive lands, still in its black: the title and the four
// parts at a glance, each a link to its section.
export function IntroTop() {
  return (
    <section className="theme-ink grid min-h-svh items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
      <FadeIn stagger>
        <p className="label text-(--muted)">Series of Trials</p>
        <h2 className="mt-4 font-wide text-[clamp(2.25rem,5vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.02em]">
          <T value={introPage.title} />
        </h2>
        <p className="mt-4 text-[15px] text-(--muted)">
          <T value={introPage.lead} />
        </p>
      </FadeIn>
      <FadeIn>
        <IntroContents variant="list" />
      </FadeIn>
    </section>
  );
}

// One part of the page, under its number, label and title. It stays where it
// is as the page scrolls; it only fades in once on arrival.
function Section({ index, children }: { index: number; children: ReactNode }) {
  const { id, label, title } = introPage.sections[index];
  return (
    <section id={id} className="scroll-mt-24 border-t border-(--line) py-20 sm:py-28">
      <FadeIn>
        <p className="label text-(--muted)">
          {String(index + 1).padStart(2, "0")} · <T value={label} />
        </p>
        <h2 className="mt-4 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.15] font-semibold tracking-[-0.03em]">
          <TLines value={title} />
        </h2>
        <div className="mt-10">{children}</div>
      </FadeIn>
    </section>
  );
}

// Numbered cards, all in view at once.
function CardGrid({ items }: { items: { name: Localized | string; text: Localized }[] }) {
  return (
    <FadeIn stagger className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => {
        const name = typeof item.name === "string" ? { ko: item.name, en: item.name } : item.name;
        return (
          <article key={i} className="card-body flex flex-col gap-3 rounded-[1.5rem] p-6 sm:gap-5 sm:p-8">
            <span className="font-serif text-4xl leading-none italic opacity-25 sm:text-5xl">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-wide text-[clamp(1.1rem,1.5vw,1.35rem)] leading-[1.15] font-semibold">
              <T value={name} />
            </h3>
            <p className="text-[15px] leading-[1.7] text-(--muted)">
              <T value={item.text} />
            </p>
          </article>
        );
      })}
    </FadeIn>
  );
}

export function IntroBody() {
  return (
    <div className="px-5 sm:px-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
      <aside className="hidden lg:block">
        <IntroContents variant="rail" />
      </aside>
      <div>
        <Section index={0}>
          <p className="max-w-4xl text-[clamp(1.25rem,2.1vw,1.75rem)] leading-[1.6] font-medium tracking-[-0.02em]">
            <T value={problem.statement} />
          </p>
        </Section>

        <Section index={1}>
          <NameMark />
          <p className="mt-10 font-serif text-[clamp(2rem,3.6vw,3.25rem)] leading-none italic">{reveal.slogan}</p>
          <p className="mt-3 text-sm text-(--muted)">
            <T value={reveal.sloganSub} />
          </p>
          <p className="mt-8 text-[15px] leading-[1.8] text-(--muted)">
            <TLines value={reveal.mobius} />
          </p>
        </Section>

        <Section index={2}>
          <CardGrid items={values.items} />
        </Section>

        <Section index={3}>
          <CardGrid items={activities.items} />
        </Section>

      </div>
    </div>
  );
}
