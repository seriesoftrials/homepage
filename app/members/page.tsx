import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { MemberGrid } from "@/components/members/MemberGrid";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { membersPage } from "@/content/site";

export const metadata: Metadata = { title: "멤버 · SERIAL" };

// The founding members: a place for the group photo, then everyone four to
// a row.
export default function MembersPage() {
  return (
    <PageTransition>
      <main className="theme-ink">
        <PageTitle title={membersPage.title} eyebrow="Founding members" />
        <div className="px-5 pb-24 sm:px-8">
          <p className="-mt-4 text-[15px] text-(--muted)">
            <T value={membersPage.lead} />
          </p>
          {/* Placeholder until the group photo is taken. */}
          <div className="mt-10 grid aspect-[16/9] w-full place-items-center rounded-[2rem] border border-dashed border-(--line) bg-[#161616] sm:aspect-[21/9]">
            <span className="label text-(--muted)">
              <T value={membersPage.groupPhoto} />
            </span>
          </div>
          <div className="mt-16">
            <MemberGrid />
          </div>
        </div>
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
