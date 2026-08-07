import fs from 'node:fs';
import path from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const exact = {
  'styles.css': 120_000,
  'lazy.js': 8_000,
  'provider.js': 8_000,
};
for (const [file, max] of Object.entries(exact)) {
  const size = fs.statSync(new URL(file, dist)).size;
  if (size > max) throw new Error(`${file} ${size} exceeds ${max}`);
  console.log(`${file}: ${size}/${max}`);
}
const entry = fs.statSync(new URL('index.js', dist)).size;
const shared = fs.readdirSync(dist).filter(file => /^chunk-.*\.js$/.test(file)).reduce((sum, file) => sum + fs.statSync(path.join(new URL(dist).pathname, file)).size, 0);
const shipped = entry + shared;
if (shipped > 220_000) throw new Error(`eager runtime ${shipped} exceeds 220000`);
console.log(`eager runtime: ${shipped}/220000`);
