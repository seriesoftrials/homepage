import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/T";
import { InfoCards } from "@/components/intro/InfoCards";
import { IntroSection } from "@/components/intro/IntroSection";
import { ProgramTimeline } from "@/components/intro/ProgramTimeline";
import { SerialWordmark } from "@/components/intro/SerialWordmark";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { introPage, nameMeanings, people, perks, program, values } from "@/content/site";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// What a first visitor wants to know, in the order they would ask it: what
// the name means, how SERIAL works, what a semester looks like, what they
// get, and whether they fit. Each part is titled by what it is for.
export default function IntroPage() {
  const { sections } = introPage;
  return (
    <PageTransition>
      <main className="theme-paper">
        <PageTitle title={introPage.title} eyebrow="Series of Trials" />

        <IntroSection title={sections.name.title} lead={sections.name.lead}>
          <SerialWordmark />
          <div className="mt-12">
            <InfoCards items={nameMeanings} columns={4} />
          </div>
        </IntroSection>

        <IntroSection title={sections.values.title} lead={sections.values.lead}>
          <InfoCards items={values.items} />
        </IntroSection>

        <IntroSection title={sections.program.title} lead={program.lead}>
          <ProgramTimeline />
        </IntroSection>

        <IntroSection title={sections.perks.title}>
          <InfoCards items={perks.items} columns={3} />
        </IntroSection>

        <IntroSection title={sections.people.title} lead={people.lead}>
          <InfoCards items={people.items} columns={4} />
          <Link
            href="/join"
            className="mt-12 inline-flex rounded-full bg-(--fg) px-7 py-3.5 text-sm font-medium text-(--bg) transition-[opacity,transform] duration-300 hover:opacity-80 active:scale-95"
          >
            <T value={introPage.join} />
          </Link>
        </IntroSection>

        <SiteFooter />
      </main>
    </PageTransition>
  );
}
