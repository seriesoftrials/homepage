import type { Localized } from "@/components/i18n/T";
import { TwistText } from "./TwistText";

// The inside of every opening oval: which trial this is, and its title.
export function TrialCover({ trial, title }: { trial: string; title: Localized<string[]> }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-6 font-mono text-[11px] tracking-[0.22em] text-(--muted) uppercase">{trial}</p>
      <TwistText
        as="h2"
        text={title}
        mode="manual"
        className="text-[clamp(2.4rem,7vw,6.5rem)] leading-[1.02] font-semibold tracking-[-0.045em]"
      />
    </div>
  );
}
