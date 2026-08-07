// Scope the built dist/styles.css under `.imperal-ui` so importing the kit's
// CSS into a host app (docs.imperal.io / panel) never touches the host's own
// elements/utilities. `:root` token vars stay global (harmless); everything
// else (utilities, box-sizing) is wrapped under `.imperal-ui`. The renderer
// wraps its output in <div class="imperal-ui" style="display:contents">.
//
// THEME SELECTORS MUST STAY GLOBAL. `:root[data-theme="light"]` only ever
// matches <html>, so rewriting it to `.imperal-ui[data-theme="light"]` makes
// it match nothing — the light palette then never applies and the scoped
// `.imperal-ui:not([data-theme])` copy (which DOES match, since the class sits
// inside <html>) wins by inheritance, leaving dark cards on a light page.
// These rules declare custom properties only, so keeping them global is safe.
import fs from "node:fs";
import postcss from "postcss";
import prefixwrap from "postcss-prefixwrap";

const f = new URL("../dist/styles.css", import.meta.url);
const css = fs.readFileSync(f, "utf8");
const out = postcss([
  prefixwrap(".imperal-ui", {
    ignoredSelectors: [
      ":root",
      ":host",
      "html",
      "body",
      // :root[data-theme="light"], :root:not([data-theme]), :root[data-theme=dark] ...
      /^:root(\[[^\]]*\]|:not\([^)]*\))*$/,
    ],
  }),
]).process(css, { from: undefined });
fs.writeFileSync(f, out.css);

// Build gate: a scoped theme selector can never match (the attribute lives on
// <html>), which silently kills the light palette. Fail the build, not prod.
if (/\.imperal-ui\[data-theme/.test(out.css) || /\.imperal-ui:not\(\[data-theme\]\)/.test(out.css)) {
  throw new Error("theme selectors were scoped under .imperal-ui; they must stay global");
}
if (!/:root\[data-theme=["']?light["']?\]/.test(out.css)) {
  throw new Error("light theme palette missing from built CSS");
}
console.log("scoped dist/styles.css under .imperal-ui (theme selectors kept global)");
