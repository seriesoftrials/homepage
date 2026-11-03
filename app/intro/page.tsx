import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { TwistText } from "@/components/motion/TwistText";
import { PageScrollCue } from "@/components/site/PageScrollCue";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { introPage } from "@/content/site";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// The founding essay, one chapter per band. The bands still alternate paper
// and ink, but simply follow one another: the chapter title on the left, its
// text beside it on wide screens, all of it still.
export default function IntroPage() {
  return (
    <PageTransition>
      <main className="theme-paper">
        <PageTitle title={introPage.title} eyebrow="Series of Trials" />
        {introPage.chapters.map((chapter, i) => (
          <section key={i} className={`theme-${i % 2 === 0 ? "ink" : "paper"} px-5 py-20 sm:px-8 sm:py-28`}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
              <TwistText
                as="h2"
                text={chapter.title}
                mode="manual"
                className="text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.08] font-semibold tracking-[-0.045em]"
              />
              <div className="flex flex-col gap-6">
                {chapter.body.map((paragraph, j) => (
                  <p key={j} className="text-[16px] leading-[1.85]">
                    <T value={paragraph} />
                  </p>
                ))}
                {i === introPage.chapters.length - 1 ? (
                  <figure className="mt-10 border-t border-(--line) pt-8">
                    <blockquote className="font-serif text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.45] text-(--muted) italic">
                      <T value={introPage.quote} />
                    </blockquote>
                    <figcaption className="mt-6 flex justify-between label text-(--muted)">
                      <T value={introPage.signature.name} />
                      <span>{introPage.signature.date}</span>
                    </figcaption>
                  </figure>
                ) : null}
              </div>
            </div>
          </section>
        ))}
        <SiteFooter />
        <PageScrollCue />
      </main>
    </PageTransition>
  );
}
