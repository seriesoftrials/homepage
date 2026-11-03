import { ActivitiesSection } from "@/components/home/ActivitiesSection";
import { HomeHero } from "@/components/home/HomeHero";
import { JoinSection } from "@/components/home/JoinSection";
import { PageTransition } from "@/components/site/PageTransition";

// Three screens: the ribbon forming into the S, what SERIAL does, and "Join
// us". The story behind it is told on the intro page.
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeHero />
        <ActivitiesSection />
        {/* Join carries the footer inside, so the page ends on that one screen. */}
        <JoinSection />
      </main>
    </PageTransition>
  );
}
