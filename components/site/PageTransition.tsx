import { ViewTransition, type ReactNode } from "react";

// Wrap each page (not the layout, which persists) so route changes open the
// new page through the same oval as the sections. See globals.css.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="aperture-enter" exit="aperture-exit" default="none">
      {children}
    </ViewTransition>
  );
}
