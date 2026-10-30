import { HomeReveal } from "@/components/home/HomeReveal";
import { JoinSection } from "@/components/home/JoinSection";
import { ActivitiesSection, ValuesSection } from "@/components/home/ListSections";
import { PageTransition } from "@/components/site/PageTransition";

// The page opens on SERIAL unfolding into Series of Trials (through the loader
// on a first visit); every section after that rises as an arch, alternating
// paper and ink, and the page ends on "Join us".
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeReveal />
        <ValuesSection />
        <ActivitiesSection />
        {/* Join carries the footer inside, so the page ends on that one screen. */}
        <JoinSection />
      </main>
    </PageTransition>
  );
}
