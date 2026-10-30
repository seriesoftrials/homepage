import type { ReactNode } from "react";

export type Localized<V = string> = { ko: V; en: V };

type Props = {
  value: Localized<ReactNode>;
  as?: "span" | "div" | "p";
  className?: string;
};

// Renders both languages; CSS keyed on <html lang> hides the inactive one,
// so switching never re-renders React and never flashes on load.
export function T({ value, as: Tag = "span", className }: Props) {
  return (
    <>
      <Tag lang="ko" className={className ? `i18n-ko ${className}` : "i18n-ko"}>
        {value.ko}
      </Tag>
      <Tag lang="en" className={className ? `i18n-en ${className}` : "i18n-en"}>
        {value.en}
      </Tag>
    </>
  );
}

// Copy written as separate lines (a title broken where it should break): each
// line is its own block, in both languages.
export function TLines({ value }: { value: Localized<string[]> }) {
  return (
    <>
      {(["ko", "en"] as const).map((lang) => (
        <span key={lang} lang={lang} className={`i18n-${lang}`}>
          {value[lang].map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}
