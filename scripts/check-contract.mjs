import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync(new URL('../contracts/imperal-sdk-ui.json', import.meta.url)));
const source = fs.readFileSync(new URL('../src/register-all.ts', import.meta.url), 'utf8');
const registered = new Set(
  [...source.matchAll(/registerComponent\('([^']+)',\s*[A-Za-z0-9_]+\)/g)].map((match) => match[1].toLowerCase()),
);

const required = new Set(manifest.visualNodeTypes.map((type) => type.toLowerCase()));
const allowedExtra = new Set(Object.keys(manifest.rendererExtensions).map((type) => type.toLowerCase()));
const missing = [...required].filter((type) => !registered.has(type)).sort();
const unexplained = [...registered].filter((type) => !required.has(type) && !allowedExtra.has(type)).sort();

if (missing.length || unexplained.length) {
  if (missing.length) console.error(`Missing SDK visual node types: ${missing.join(', ')}`);
  if (unexplained.length) console.error(`Unexplained renderer node types: ${unexplained.join(', ')}`);
  process.exit(1);
}

console.log(`contract ok: ${required.size} SDK visual types, ${registered.size} registered types`);
