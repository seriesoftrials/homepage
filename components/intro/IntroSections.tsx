import type { ReactNode } from "react";
import { T, TLines } from "@/components/i18n/T";
import { FadeIn } from "@/components/motion/FadeIn";
import { introPage, perks, problem, program, reveal } from "@/content/site";
import { IntroContents } from "./IntroContents";
import { RibbonStory } from "./RibbonStory";

const number = (i: number) => String(i + 1).padStart(2, "0");

// One part of the page, under its number, label and title. It stays where it
// is as the page scrolls; its heading fades in once on arrival.
function Section({ index, children }: { index: number; children: ReactNode }) {
  const { id, label, title } = introPage.sections[index];
  return (
    <section id={id} className="scroll-mt-24 border-t border-(--line) py-16 sm:py-24">
      <FadeIn>
        <p className="label text-(--muted)">
          {number(index)} · <T value={label} />
        </p>
        <h2 className="mt-4 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.15] font-semibold tracking-[-0.03em]">
          <TLines value={title} />
        </h2>
      </FadeIn>
      <div className="mt-10">{children}</div>
    </section>
  );
}

// The problem, and what students are missing because of it.
function Problem() {
  return (
    <>
      <FadeIn>
        <p className="max-w-4xl text-[clamp(1.25rem,2.1vw,1.75rem)] leading-[1.6] font-medium tracking-[-0.02em]">
          <T value={problem.statement} />
        </p>
      </FadeIn>
      <FadeIn stagger className="mt-12 grid gap-4 sm:grid-cols-3">
        {problem.needs.map((need) => (
          <article key={need.name.en} className="card-body flex flex-col gap-3 rounded-[1.5rem] p-6 sm:p-7">
            <h3 className="text-lg font-semibold">
              <T value={need.name} />
            </h3>
            <p className="text-[15px] leading-[1.7] text-(--muted)">
              <T value={need.text} />
            </p>
          </article>
        ))}
      </FadeIn>
    </>
  );
}

// The ribbon takes the problem on: scattered ambition forms into the S, and
// the Möbius lines say what the shape stands for.
function Logo() {
  return (
    <>
      <RibbonStory />
      <FadeIn>
        <p className="mt-12 text-[15px] leading-[1.8] text-(--muted)">
          <TLines value={reveal.mobius} />
        </p>
      </FadeIn>
    </>
  );
}

// The semester at a glance: one row per step, its weeks on the left, the
// three trials marked.
function Program() {
  return (
    <>
      <FadeIn>
        <p className="max-w-2xl text-[15px] leading-[1.7] text-(--muted)">
          <T value={program.lead} />
        </p>
      </FadeIn>
      <FadeIn stagger className="mt-10 border-t border-(--line)">
        {program.steps.map((step) => (
          <div
            key={step.name}
            className="grid gap-2 border-b border-(--line) py-5 sm:grid-cols-[8rem_minmax(0,16rem)_minmax(0,1fr)] sm:items-baseline sm:gap-6"
          >
            <span className="label text-(--muted)">{step.week}</span>
            <span className="flex items-center gap-3">
              <span className="font-wide text-[1.05rem] leading-tight font-semibold">{step.name}</span>
              {step.trial ? (
                <span className="label rounded-full px-2.5 py-1 text-(--muted) shadow-[inset_0_0_0_1px_var(--line)]">
                  <T value={{ ko: `시도 ${step.trial}`, en: `Trial ${step.trial}` }} />
                </span>
              ) : null}
            </span>
            <p className="text-[15px] leading-[1.7] text-(--muted)">
              <T value={step.text} />
            </p>
          </div>
        ))}
      </FadeIn>
    </>
  );
}

// What a member comes away with, all at once.
function Perks() {
  return (
    <FadeIn stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {perks.items.map((item, i) => (
        <article key={item.name} className="card-body flex flex-col gap-3 rounded-[1.5rem] p-6 sm:gap-5 sm:p-7">
          <span className="font-serif text-4xl leading-none italic opacity-25">{number(i)}</span>
          <h3 className="font-wide text-[1.15rem] leading-tight font-semibold">{item.name}</h3>
          <p className="text-[15px] leading-[1.7] text-(--muted)">
            <T value={item.text} />
          </p>
        </article>
      ))}
    </FadeIn>
  );
}

// The whole page above the footer: the contents on the left (wide screens),
// the title and the sections in order on the right, read as a plain page.
export function IntroBody() {
  return (
    <div className="px-5 pt-24 sm:px-8 sm:pt-28 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
      <aside className="hidden lg:block">
        <IntroContents />
      </aside>
      <div>
        <FadeIn className="pb-12">
          <p className="label text-(--muted)">Series of Trials</p>
          <h1 className="mt-4 font-wide text-[clamp(2.25rem,5vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.02em]">
            <T value={introPage.title} />
          </h1>
        </FadeIn>

        <Section index={0}>
          <Problem />
        </Section>
        <Section index={1}>
          <Logo />
        </Section>
        <Section index={2}>
          <Program />
        </Section>
        <Section index={3}>
          <Perks />
        </Section>
      </div>
    </div>
  );
}
