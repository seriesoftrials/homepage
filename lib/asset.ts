// Path to a file in /public, under the base path when the site is served from
// a sub-path (the GitHub Pages preview). next/link and next/font add it on
// their own; plain <img> sources need this.
export function asset(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
