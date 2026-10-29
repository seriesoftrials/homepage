import { HomeHero } from "@/components/home/HomeHero";
import { JoinSection } from "@/components/home/JoinSection";
import { ActivitiesSection, ValuesSection } from "@/components/home/ListSections";
import { PeopleSection } from "@/components/home/PeopleSection";
import { ProblemSection } from "@/components/home/ProblemSection";
import { RevealSection } from "@/components/home/RevealSection";
import { TalentSection } from "@/components/home/TalentSection";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

// Each section after the hero opens through the loop aperture, alternating
// paper and ink: Trial 01 to Trial 07.
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeHero />
        <ProblemSection />
        <RevealSection />
        <ValuesSection />
        <ActivitiesSection />
        <PeopleSection />
        <TalentSection />
        <JoinSection />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
