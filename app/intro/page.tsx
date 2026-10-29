import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { LoopAperture } from "@/components/motion/LoopAperture";
import { TrialCover } from "@/components/motion/TrialCover";
import { TwistText } from "@/components/motion/TwistText";
import { PageTitle } from "@/components/site/PageTitle";
import { PageTransition } from "@/components/site/PageTransition";
import { SiteFooter } from "@/components/site/SiteFooter";
import { introPage } from "@/content/site";

export const metadata: Metadata = { title: "소개 · SERIAL" };

// The founding essay, one chapter per oval.
export default function IntroPage() {
  return (
    <PageTransition>
      <main>
        <section className="theme-paper min-h-svh pb-[30svh]">
          <PageTitle title={introPage.title} eyebrow="Series of Trials" />
        </section>
        {introPage.chapters.map((chapter, i) => (
          <LoopAperture
            key={i}
            theme={i % 2 === 0 ? "ink" : "paper"}
            cover={<TrialCover trial={`Chapter ${String(i + 1).padStart(2, "0")}`} title={chapter.title} />}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pt-6 pb-[45svh] sm:px-8">
              {chapter.body.map((paragraph, j) => (
                <TwistText key={j} soft as="p" text={paragraph} className="text-[17px] leading-[1.9]" />
              ))}
              {i === introPage.chapters.length - 1 ? (
                <figure className="mt-16 border-t border-(--line) pt-10">
                  <blockquote className="font-serif text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.45] text-(--muted) italic">
                    <T value={introPage.quote} />
                  </blockquote>
                  <figcaption className="mt-8 flex justify-between font-mono text-[11px] tracking-[0.18em] text-(--muted)">
                    <T value={introPage.signature.name} />
                    <span>{introPage.signature.date}</span>
                  </figcaption>
                </figure>
              ) : null}
            </div>
          </LoopAperture>
        ))}
        <SiteFooter />
      </main>
    </PageTransition>
  );
}
