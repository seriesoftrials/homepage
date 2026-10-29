"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOCALE_KEY } from "./LocaleScript";

// A glass pill with a knob that slides between KO and EN. The knob's position
// and the active label come from CSS keyed on <html lang> (see globals.css),
// so the switch is right on first paint and never re-renders.
export function LocaleToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.lang === "en" ? "ko" : "en";
    root.lang = next;
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {}
    // Text lengths change, so every scrubbed timeline must re-measure.
    ScrollTrigger.refresh();
  }

  return (
    <button type="button" onClick={toggle} className={`locale-toggle ${className}`}>
      <span className="sr-only">
        <span className="i18n-ko">Switch to English</span>
        <span className="i18n-en">한국어로 보기</span>
      </span>
      <span aria-hidden="true" className="locale-toggle__knob" />
      <span aria-hidden="true" className="locale-toggle__option locale-toggle__option--ko">
        KO
      </span>
      <span aria-hidden="true" className="locale-toggle__option locale-toggle__option--en">
        EN
      </span>
    </button>
  );
}
