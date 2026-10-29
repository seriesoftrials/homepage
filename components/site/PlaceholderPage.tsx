import type { Localized } from "@/components/i18n/T";
import { T } from "@/components/i18n/T";
import { placeholderPages } from "@/content/site";
import { PageTitle } from "./PageTitle";
import { PageTransition } from "./PageTransition";
import { SiteFooter } from "./SiteFooter";

// Pages that exist in the menu but have no content yet.
export function PlaceholderPage({ title }: { title: Localized }) {
  return (
    <PageTransition>
      <main className="theme-paper flex min-h-svh flex-col">
        <PageTitle title={title} eyebrow="Coming soon" />
        <p className="flex-1 px-5 text-[15px] text-(--muted) sm:px-8">
          <T value={placeholderPages.soon} />
        </p>
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
