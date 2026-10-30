import type { Metadata } from "next";
import { IntroBody } from "@/components/intro/IntroSections";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// "About SERIAL": the story the ribbon tells as it forms, the problem, the
// name, why we exist and what we do, read in order down a plain page that
// keeps what has been read in place, with the contents alongside.
export default function IntroPage() {
  return (
    <PageTransition>
      <main className="theme-paper">
        <IntroBody />
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
