import { T } from "@/components/i18n/T";
import { TwistText } from "@/components/motion/TwistText";
import { activities } from "@/content/site";

// What SERIAL does, all four at once: the folder-tab cards side by side
// instead of stacked one per screen. The title is set still, not flipped in
// on scroll.
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
            <li key={item.name.en} className="flex flex-col">
              <div className="flex">
                <span className="card-tab rounded-t-2xl px-5 pt-3 pb-2 label">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="card-body flex flex-1 flex-col gap-4 rounded-tr-[1.75rem] rounded-b-[1.75rem] p-6">
                <h3 className="font-wide text-[1.35rem] leading-[1.1] font-semibold tracking-[-0.01em]">
                  <T value={item.name} />
                </h3>
                <p className="text-[15px] leading-[1.7] text-(--muted)">
                  <T value={item.text} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
