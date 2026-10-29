import type { Localized } from "@/components/i18n/T";
import { TwistText } from "./TwistText";

// The inside of every rising arch: the section title, flipping in as it rises.
export function SectionCover({ title }: { title: Localized<string[]> }) {
  return (
    <TwistText
      as="h2"
      text={title}
      mode="manual"
      className="text-center text-[clamp(2.4rem,7vw,6.5rem)] leading-[1.02] font-semibold tracking-[-0.045em]"
    />
  );
}
