import { T, type Localized } from "@/components/i18n/T";

// A short label over two chevrons that brighten one after the other and nudge
// downward: "scroll".
export function ScrollCue({ label, className = "" }: { label: Localized; className?: string }) {
  return (
    <div className={`scroll-cue flex flex-col items-center gap-2 ${className}`}>
      <span className="label opacity-70">
        <T value={label} />
      </span>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path className="scroll-cue__chevron" d="M5 4.5l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path className="scroll-cue__chevron" d="M5 11.5l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
