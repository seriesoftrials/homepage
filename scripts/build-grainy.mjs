import { access, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(root, "grainy");
const output = resolve(root, "public/grainy");

await mkdir(output, { recursive: true });
await cp(resolve(source, "public"), output, { recursive: true });
const [template, intro, japaneseFonts, css] = await Promise.all([
  readFile(resolve(source, "index.html"), "utf8"),
  readFile(resolve(source, "intro.html"), "utf8"),
  readFile(resolve(source, "public/fonts/pretendard-jp/font-face.css"), "utf8"),
  readFile(resolve(source, "public/ver2.css"), "utf8"),
]);
const article = intro.match(/<article class="manifesto">[\s\S]*?<\/article>/)?.[0];
if (!article || !template.includes("<!-- SPIRIT_ORIGIN_ARTICLE -->")) {
  throw new Error("The Spirit reader needs the original intro article.");
}
const html = template.replace("<!-- SPIRIT_ORIGIN_ARTICLE -->", article);
await Promise.all([
  writeFile(resolve(output, "index.html"), html),
  writeFile(resolve(output, "intro.html"), intro),
  writeFile(resolve(output, "ver2.css"), `${japaneseFonts}\n${css}`),
  build({
    entryPoints: [resolve(source, "src/ver2-hero.js")],
    outfile: resolve(output, "ver2-hero.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify: true,
    legalComments: "eof",
  }),
]);

// Catch incomplete asset transfers before development or production starts.
const routes = new Set(["/", "/index.html", "/ver2", "/intro"]);
const references = new Set();
for (const page of [html, intro]) {
  for (const match of page.matchAll(/(?:src|href)=["'](\/[^"']*)["']/g)) {
    references.add(match[1]);
  }
  for (const match of page.matchAll(/data-spirit-frames="([^"]+)"/g)) {
    match[1].split(",").forEach((url) => references.add(url));
  }
}
async function checkCss(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await checkCss(path);
    else if (entry.name.endsWith(".css")) {
      const text = await readFile(path, "utf8");
      for (const match of text.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)) {
        references.add(match[1]);
      }
    }
  }
}
await checkCss(output);
for (const url of references) {
  const pathname = new URL(url, "http://localhost").pathname;
  if (!routes.has(pathname)) await access(resolve(output, `.${pathname}`));
}
console.log(`Grainy landing built; ${references.size} local references verified.`);
