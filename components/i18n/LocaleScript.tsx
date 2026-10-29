export const LOCALE_KEY = "serial-locale";

// Also marks the first load of "/" as the intro, so the header is hidden from
// the first frame instead of fading out once React hydrates.
const script = `try{var d=document.documentElement,l=localStorage.getItem("${LOCALE_KEY}");if(l==="en"||l==="ko")d.lang=l;if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("is-intro")}catch(e){}`;

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
