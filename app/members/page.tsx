import type { Metadata } from "next";
import { MemberOrbit } from "@/components/members/MemberOrbit";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "멤버 · SERIAL" };

// One full screen: the founding members revolve on the loop, and selecting
// one opens their profile in the centre.
export default function MembersPage() {
  return (
    <PageTransition>
      <main className="theme-ink relative">
        <MemberOrbit />
        <SiteFooter inline="desktop" />
      </main>
    </PageTransition>
  );
}
