import { AboutSection } from "@/components/home/AboutSection";
import { ActivitiesSection } from "@/components/home/ActivitiesSection";
import { HomeHero } from "@/components/home/HomeHero";
import { JoinSection } from "@/components/home/JoinSection";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

// A few screens: the ribbon forming into the S, who SERIAL is, what it
// does, and "Join us". The details are on the intro page.
export default function Home() {
  return (
    <PageTransition>
      <main>
        <HomeHero />
        <AboutSection />
        <ActivitiesSection />
        <JoinSection />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
