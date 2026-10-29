import { T } from "@/components/i18n/T";
import { brand } from "@/content/site";

// `inline` lays the footer over the bottom of the last full-screen section, so
// a page can end exactly on that screen instead of scrolling a strip further.
// "desktop" does so from the sm breakpoint and stacks below on phones, where a
// full-screen section has no spare room at its foot.
const PLACEMENT = {
  block: "theme-ink relative py-10",
  inline: "absolute inset-x-0 bottom-0 pb-8 text-left",
  desktop: "theme-ink relative py-10 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-transparent sm:py-0 sm:pb-8",
};

export function SiteFooter({ inline = false }: { inline?: boolean | "desktop" }) {
  const placement = inline === "desktop" ? PLACEMENT.desktop : inline ? PLACEMENT.inline : PLACEMENT.block;
  return (
    <footer
      className={`flex flex-col gap-6 px-5 text-[12px] text-muted-ink sm:flex-row sm:items-end sm:justify-between sm:px-8 ${placement}`}
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
