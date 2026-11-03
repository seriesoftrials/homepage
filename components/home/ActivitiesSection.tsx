import { T } from "@/components/i18n/T";
import { GlassStage } from "@/components/motion/GlassStage";
import { TwistText } from "@/components/motion/TwistText";
import { activities } from "@/content/site";

// What SERIAL does, all four at once as glass cards side by side (two
// across on tablets, stacked on phones) over soft shapes for them to frost.
// Each card reads in three steps: the name, the point in a line, then the
// detail. The title is set still, not flipped in on scroll.
export function ActivitiesSection() {
  return (
    <section className="theme-paper px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <TwistText
          as="h2"
          text={activities.title}
          mode="manual"
          className="text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.045em]"
        />
        <GlassStage className="mt-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activities.items.map((item) => (
              <li key={item.name.en} className="glass-card flex flex-col p-7">
                <h3 className="text-[1.6rem] leading-tight font-bold tracking-[-0.03em]">
                  <T value={item.name} />
                </h3>
                <p className="mt-3 text-[16px] leading-snug font-semibold tracking-[-0.01em]">
                  <T value={item.point} />
                </p>
                <p className="mt-4 border-t border-(--fg)/10 pt-4 text-[14px] leading-[1.7] text-(--fg)/65">
                  <T value={item.text} />
                </p>
              </li>
            ))}
          </ul>
        </GlassStage>
      </div>
    </section>
  );
}
