// Scope the built dist/styles.css under `.imperal-ui` so importing the kit's
// CSS into a host app (docs.imperal.io / panel) never touches the host's own
// elements/utilities. `:root` token vars stay global (harmless); everything
// else (utilities, box-sizing) is wrapped under `.imperal-ui`. The renderer
// wraps its output in <div class="imperal-ui" style="display:contents">.
import fs from "node:fs";
import postcss from "postcss";
import prefixwrap from "postcss-prefixwrap";

const f = new URL("../dist/styles.css", import.meta.url);
const css = fs.readFileSync(f, "utf8");
const out = postcss([
  prefixwrap(".imperal-ui", { ignoredSelectors: [":root", ":host", "html", "body"] }),
]).process(css, { from: undefined });
fs.writeFileSync(f, out.css);
console.log("scoped dist/styles.css under .imperal-ui");
