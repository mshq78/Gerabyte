/**
 * Post-build guard: no demo, mock or preview artefact may reach a production
 * bundle. Run by `npm run build`, so `npm run check` covers it too.
 */
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const FORBIDDEN = ['DEMO_ONLY', 'mock_jwt', 'PaletteDemo', 'پنل دموی'];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = await walk(DIST).catch(() => {
  console.error(`check-dist: ${DIST} not found — run the build first.`);
  process.exit(1);
});

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // binary asset
  }
  for (const needle of FORBIDDEN) {
    if (text.includes(needle)) hits.push({ file: path.relative(process.cwd(), file), needle });
  }
}

if (hits.length) {
  console.error('check-dist: forbidden strings found in the production bundle:');
  for (const h of hits) console.error(`  ${h.file}: ${h.needle}`);
  process.exit(1);
}

console.log(`check-dist: ${files.length} files scanned, none of [${FORBIDDEN.join(', ')}] present.`);
