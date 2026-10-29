import { T } from "@/components/i18n/T";
import { LoopAperture } from "@/components/motion/LoopAperture";
import { TrialCover } from "@/components/motion/TrialCover";
import { TwistText } from "@/components/motion/TwistText";
import { talent } from "@/content/site";

export function TalentSection() {
  return (
    <LoopAperture theme="paper" cover={<TrialCover trial={talent.trial} title={talent.title} />}>
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-[40svh] sm:px-8">
        <div className="grid gap-12 border-t border-(--line) pt-10 sm:grid-cols-2">
          {[talent.pursue, talent.avoid].map((group, i) => (
            <div key={i}>
              <p className="mb-6 font-mono text-[11px] tracking-[0.18em] text-(--muted) uppercase">
                <T value={group.label} />
              </p>
              <ul className="flex flex-col gap-3">
                {group.items.map((item, j) => (
                  <li key={j}>
                    <TwistText
                      text={item}
                      className={`text-[clamp(1.3rem,2.4vw,2rem)] leading-[1.3] font-semibold tracking-[-0.03em] ${
                        i === 1 ? "twist-strike text-(--muted)" : ""
                      }`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-32 mb-8 font-mono text-[11px] tracking-[0.18em] text-(--muted) uppercase">
          <T value={talent.questionsLabel} />
        </p>
        <div className="flex flex-col gap-14">
          {talent.questions.map((question, i) => (
            <TwistText
              key={i}
              text={question}
              className="max-w-4xl font-serif text-[clamp(1.75rem,3.8vw,3.5rem)] leading-[1.2] tracking-[-0.01em]"
            />
          ))}
        </div>
      </div>
    </LoopAperture>
  );
}
