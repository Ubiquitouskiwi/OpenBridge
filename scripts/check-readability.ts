/**
 * Flesch–Kincaid readability check on English UI strings (requirement 5.6.4, Q34).
 * Targets a 6th–8th grade level. Warns (does not fail) above the threshold so copy can be
 * improved iteratively without blocking releases.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const enDir = resolve(here, '../packages/web-app/src/i18n/locales/en');
const GRADE_TARGET = 8;

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return w ? 1 : 0;
  const groups = w.replace(/e$/, '').match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function collectStrings(obj: unknown, out: string[]): void {
  if (typeof obj === 'string') out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((v) => collectStrings(v, out));
  else if (obj && typeof obj === 'object')
    Object.values(obj).forEach((v) => collectStrings(v, out));
}

const strings: string[] = [];
for (const file of readdirSync(enDir).filter((f) => f.endsWith('.json'))) {
  collectStrings(JSON.parse(readFileSync(resolve(enDir, file), 'utf8')), strings);
}

const text = strings.join(' ');
const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
const words = text.split(/\s+/).filter(Boolean);
const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
const grade =
  0.39 * (words.length / sentences) + 11.8 * (syllables / Math.max(1, words.length)) - 15.59;

console.log(
  `Flesch–Kincaid grade level (en UI copy): ${grade.toFixed(1)} (target <= ${GRADE_TARGET})`,
);
if (grade > GRADE_TARGET) {
  console.warn(`⚠ Copy reads above grade ${GRADE_TARGET}. Consider simplifying.`);
}
