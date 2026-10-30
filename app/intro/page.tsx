import type { Metadata } from "next";
import { IntroHero } from "@/components/intro/IntroHero";
import { ProblemSection } from "@/components/intro/ProblemSection";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// The ribbon forms into the S and dives into its black band, which becomes the
// background of the problem SERIAL exists to solve.
export default function IntroPage() {
  return (
    <PageTransition>
      <main>
        <IntroHero />
        <ProblemSection />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
