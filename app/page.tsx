import { HomeHero } from "@/components/home/HomeHero";
import { JoinSection } from "@/components/home/JoinSection";
import { ActivitiesSection, ValuesSection } from "@/components/home/ListSections";
import { ProblemSection } from "@/components/home/ProblemSection";
import { RevealSection } from "@/components/home/RevealSection";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

// The hero dives into the ribbon's black band, which becomes the problem
// statement's background; every section after that rises as an arch,
// alternating paper and ink, and the page ends on "Join us".
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeHero />
        <ProblemSection />
        <RevealSection />
        <ValuesSection />
        <ActivitiesSection />
        <JoinSection />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
