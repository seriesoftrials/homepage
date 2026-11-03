import { T } from "@/components/i18n/T";
import { program } from "@/content/site";

// The semester top to bottom on one hairline: a dot per step, filled for
// the three trials, with its weeks, name and what happens.
export function ProgramTimeline() {
  return (
    <ol className="relative ml-1 border-l border-(--line)">
      {program.steps.map((step) => (
        <li key={step.name} className="relative pb-9 pl-8 last:pb-0">
          <span
            aria-hidden="true"
            className={`absolute top-[0.4rem] -left-[5px] size-[9px] rounded-full ${
              step.trial ? "bg-(--fg)" : "bg-(--bg) shadow-[inset_0_0_0_1px_var(--muted)]"
            }`}
          />
          <p className="label text-(--muted)">{step.week}</p>
          <h3 className="mt-2 flex flex-wrap items-center gap-3 font-wide text-[1.1rem] leading-tight font-semibold">
            {step.name}
            {step.trial ? (
              <span className="rounded-full px-2.5 py-1 label text-[10px] text-(--muted) shadow-[inset_0_0_0_1px_var(--line)]">
                <T value={{ ko: `시도 ${step.trial}`, en: `Trial ${step.trial}` }} />
              </span>
            ) : null}
          </h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-(--muted)">
            <T value={step.text} />
          </p>
        </li>
      ))}
    </ol>
  );
}
