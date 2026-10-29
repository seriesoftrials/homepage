"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LOCALE_KEY } from "./LocaleScript";

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
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <span className="i18n-ko" aria-label="Switch to English">
        <b>KO</b> <span className="opacity-40">/ EN</span>
      </span>
      <span className="i18n-en" aria-label="한국어로 보기">
        <span className="opacity-40">KO /</span> <b>EN</b>
      </span>
    </button>
  );
}
