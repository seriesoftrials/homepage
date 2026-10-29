import { LoopAperture } from "@/components/motion/LoopAperture";
import { TrialCover } from "@/components/motion/TrialCover";
import { TwistText } from "@/components/motion/TwistText";
import { problem } from "@/content/site";

export function ProblemSection() {
  return (
    <LoopAperture theme="ink" cover={<TrialCover trial={problem.trial} title={problem.title} />}>
      <div className="mx-auto max-w-6xl px-5 pt-10 pb-[40svh] sm:px-8">
        <TwistText
          text={problem.lead}
          className="max-w-4xl font-serif text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.25] tracking-[-0.01em]"
        />
        <div className="mt-24 grid gap-10 border-t border-(--line) pt-10 sm:grid-cols-3">
          {problem.points.map((point, i) => (
            <div key={i} className="flex flex-col gap-4">
              <span className="font-mono text-[11px] tracking-[0.18em] text-(--muted)">0{i + 1}</span>
              <TwistText soft text={point} className="text-[15px] leading-[1.75] text-(--muted)" />
            </div>
          ))}
        </div>
      </div>
    </LoopAperture>
  );
}
