import { T } from "@/components/i18n/T";
import { brand } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="theme-ink relative flex flex-col gap-6 px-5 py-10 text-[12px] text-muted-ink sm:flex-row sm:items-end sm:justify-between sm:px-8">
      <div>
        <p className="font-wide text-base font-semibold text-paper">{brand.name}</p>
        <p className="mt-1">
          <T value={brand.society} />
        </p>
      </div>
      <div className="flex flex-col gap-1 font-mono tracking-[0.12em] sm:items-end">
        <a href={brand.mapUrl} target="_blank" rel="noreferrer" className="hover:text-paper">
          {brand.coordinates}
        </a>
        <span>{brand.established}</span>
      </div>
    </footer>
  );
}
