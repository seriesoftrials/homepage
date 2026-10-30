export const LOCALE_KEY = "serial-locale";

// Also marks a full load of "/" (first visit or refresh) as the intro: the
// header is hidden from the first frame, and window.__serialIntro tells the
// home page's first screen to play the loader (EyeLoader). Client-side navigation never runs this script, so
// clicking Home within the site skips the loader.
const script = `try{var d=document.documentElement,l=localStorage.getItem("${LOCALE_KEY}");if(l==="en"||l==="ko")d.lang=l;if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("is-intro");window.__serialIntro=true}}catch(e){}`;

// Runs while the HTML is parsed, before first paint, so the stored language
// is applied without a flash (see Next.js "Preventing flash before hydration").
export function LocaleScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
