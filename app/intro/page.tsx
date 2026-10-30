import type { Metadata } from "next";
import { IntroHero } from "@/components/intro/IntroHero";
import { JoinSection } from "@/components/intro/JoinSection";
import { ActivitiesSection, ValuesSection } from "@/components/intro/ListSections";
import { NameSection } from "@/components/intro/NameSection";
import { ProblemSection } from "@/components/intro/ProblemSection";
import { PageTransition } from "@/components/site/PageTransition";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// SERIAL's story in one run: the ribbon forms into the S and dives into its
// black band, which carries the problem; the name answers it; then why we
// exist, what we do, and an invitation to join. After the problem, each
// section rises as an arch, alternating paper and ink.
export default function IntroPage() {
  return (
    <PageTransition>
      <main>
        <IntroHero />
        <ProblemSection />
        <NameSection />
        <ValuesSection />
        <ActivitiesSection />
        {/* Join carries the footer inside, so the page ends on that one screen. */}
        <JoinSection />
      </main>
    </PageTransition>
  );
}
