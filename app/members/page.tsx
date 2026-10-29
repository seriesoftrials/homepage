import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { MemberCard } from "@/components/members/MemberCard";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { members, membersPage } from "@/content/site";

export const metadata: Metadata = { title: "멤버 · SERIAL" };

export default function MembersPage() {
  return (
    <PageTransition>
      <main className="theme-ink min-h-svh">
        <PageTitle title={membersPage.title} eyebrow="Founding members" />
        <p className="-mt-6 px-5 text-[15px] text-(--muted) sm:px-8">
          <T value={membersPage.lead} />
        </p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-14 px-5 pt-16 pb-32 min-[480px]:grid-cols-2 sm:px-8 md:grid-cols-3 lg:grid-cols-4">
          {members.map((member) => (
            <MemberCard key={member.slug} member={member} />
          ))}
        </div>
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
