import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../i18n/locales/', import.meta.url);
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );
const load = (file) => new Map(flatten(JSON.parse(readFileSync(new URL(file, dir), 'utf8'))));

const reference = load('en.json');
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const locale = load(file);
  const missing = [...reference.keys()].filter((k) => !locale.has(k));
  const extra = [...locale.keys()].filter((k) => !reference.has(k));
  const empty = [...locale].filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
  for (const [label, keys] of [['missing', missing], ['extra', extra], ['empty', empty]]) {
    if (keys.length) {
      failed = true;
      console.error(`${file}: ${label} keys -> ${keys.join(', ')}`);
    }
  }
}

if (failed) process.exit(1);
console.log('Locales OK');
