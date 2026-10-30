import type { Metadata } from "next";
import { IntroHero } from "@/components/intro/IntroHero";
import { IntroBody, IntroTop } from "@/components/intro/IntroSections";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// "About SERIAL": the ribbon forms the S as its meaning is told, dives into
// the band, and lands on the four parts listed at a glance; they are then read
// in that order down a plain page that keeps what has been read in place.
export default function IntroPage() {
  return (
    <PageTransition>
      <main className="theme-paper">
        <IntroHero />
        <IntroTop />
        <IntroBody />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
