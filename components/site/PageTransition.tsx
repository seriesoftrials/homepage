import { ViewTransition, type ReactNode } from "react";

// Wrap each page (not the layout, which persists) so route changes lift the
// old page away and settle the new one into place. See globals.css.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
