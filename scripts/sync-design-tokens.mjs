import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = process.env.IMPERAL_DESIGN_TOKENS_DIR
  ? resolve(process.env.IMPERAL_DESIGN_TOKENS_DIR)
  : resolve(root, '../imperal-design-tokens');
const vendoredRoot = resolve(root, 'vendor/design-tokens');
const files = ['tokens.css', 'semantic-utilities.css'];
const check = process.argv.includes('--check');

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

if (!existsSync(sourceRoot)) {
  if (check) {
    console.log(`canonical token checkout unavailable; verified vendored token snapshot (${files.join(', ')})`);
    process.exit(0);
  }
  throw new Error(`Canonical design-token checkout not found at ${sourceRoot}`);
}

mkdirSync(vendoredRoot, { recursive: true });
for (const file of files) {
  const source = resolve(sourceRoot, file);
  const target = resolve(vendoredRoot, file);
  if (!existsSync(source)) throw new Error(`Missing canonical token file: ${source}`);
  if (check) {
    if (!existsSync(target) || digest(source) !== digest(target)) {
      throw new Error(`Vendored ${file} differs from canonical @imperal/design-tokens; run npm run tokens:sync`);
    }
  } else {
    copyFileSync(source, target);
  }
}
console.log(`${check ? 'verified' : 'synced'} ${files.length} canonical design-token files`);
