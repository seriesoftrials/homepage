import { T } from "@/components/i18n/T";
import { TwistText } from "@/components/motion/TwistText";
import { activities } from "@/content/site";

// What SERIAL does, all four at once as iOS-style cards side by side (two
// across on tablets, stacked on phones). The title is set still, not flipped
// in on scroll.
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
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activities.items.map((item, i) => (
            <li key={item.name.en} className="ios-card flex flex-col gap-4 p-6">
              <span className="ios-card__badge grid size-10 place-items-center label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-[1.25rem] leading-tight font-semibold tracking-[-0.02em]">
                <T value={item.name} />
              </h3>
              <p className="-mt-2 text-[15px] leading-[1.65] text-(--muted)">
                <T value={item.text} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
