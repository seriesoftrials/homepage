import { T } from "@/components/i18n/T";
import { GlassStage } from "@/components/motion/GlassStage";
import { TwistText } from "@/components/motion/TwistText";
import { about } from "@/content/site";

// Who SERIAL is, between the hero and what it does: one line saying what it
// is, one it holds to, and three numbers large on glass cards. Set still.
export function AboutSection() {
  return (
    <section className="theme-paper px-5 pt-24 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <p className="label text-(--muted)">
          <T value={about.label} />
        </p>
        <TwistText
          as="h2"
          text={about.title}
          mode="manual"
          className="mt-5 text-[clamp(2.2rem,5vw,4.25rem)] leading-[1.08] font-semibold tracking-[-0.045em]"
        />
        <p className="mt-8 max-w-2xl text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.7] text-(--muted)">
          <T value={about.line} />
        </p>
        <GlassStage className="mt-14">
          <dl className="grid gap-4 sm:grid-cols-3">
            {about.facts.map((fact) => (
              <div key={fact.label.en} className="glass-card flex flex-col-reverse gap-3 p-7">
                <dt className="text-[15px] font-medium text-(--fg)/65">
                  <T value={fact.label} />
                </dt>
                <dd className="flex items-baseline gap-1.5 font-wide text-[clamp(2.75rem,5vw,4.25rem)] leading-none font-semibold tracking-[-0.03em]">
                  {fact.value}
                  <span className="font-sans text-[1.1rem] font-semibold tracking-normal text-(--fg)/55">
                    <T value={fact.unit} />
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </GlassStage>
      </div>
    </section>
  );
}
