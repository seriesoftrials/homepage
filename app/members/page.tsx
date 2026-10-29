import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { MemberThread } from "@/components/members/MemberThread";
import { PageScrollCue } from "@/components/site/PageScrollCue";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { membersPage } from "@/content/site";

export const metadata: Metadata = { title: "멤버 · SERIAL" };

// The founding members, linked in turn by one line that is drawn as you scroll.
export default function MembersPage() {
  return (
    <PageTransition>
      <main className="theme-ink">
        <PageTitle title={membersPage.title} eyebrow="Founding members" />
        <p className="-mt-6 px-5 text-[15px] text-(--muted) sm:px-8">
          <T value={membersPage.lead} />
        </p>
        <div className="pt-[12svh] pb-[20svh]">
          <MemberThread />
        </div>
        <SiteFooter />
        <PageScrollCue />
      </main>
    </PageTransition>
  );
}
