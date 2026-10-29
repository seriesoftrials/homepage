import { T } from "@/components/i18n/T";
import { brand } from "@/content/site";

// `inline` lays the footer over the bottom of the last full-screen section, so
// a page can end exactly on that screen instead of scrolling a strip further.
export function SiteFooter({ inline = false }: { inline?: boolean }) {
  return (
    <footer
      className={`flex flex-col gap-6 px-5 text-[12px] text-muted-ink sm:flex-row sm:items-end sm:justify-between sm:px-8 ${
        inline ? "absolute inset-x-0 bottom-0 pb-8 text-left" : "theme-ink relative py-10"
      }`}
    >
      <div>
        <p className="font-wide text-base font-semibold text-paper">{brand.name}</p>
        <p className="mt-1">
          <T value={brand.society} />
        </p>
      </div>
      <div className="flex flex-col gap-1 label sm:items-end">
        <a href={brand.mapUrl} target="_blank" rel="noreferrer" className="hover:text-paper">
          {brand.coordinates}
        </a>
        <span>{brand.established}</span>
      </div>
    </footer>
  );
}
