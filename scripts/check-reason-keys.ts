/**
 * Fails if any engine reason code or calculation-step code lacks an English string
 * (requirement 5.9.4, Q25). English is the enforced base locale; other locales only warn
 * (checked at review time).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CalculationStepCodes, ReasonCodes } from '@openbridge/shared';

const here = dirname(fileURLToPath(import.meta.url));
const localeDir = resolve(here, '../packages/web-app/src/i18n/locales/en');

function readLocale(name: string): Record<string, string> {
  return JSON.parse(readFileSync(resolve(localeDir, `${name}.json`), 'utf8')) as Record<
    string,
    string
  >;
}

const checks = [
  { label: 'reason codes', file: 'reasons', codes: Object.values(ReasonCodes) as string[] },
  {
    label: 'calculation-step codes',
    file: 'math',
    codes: Object.values(CalculationStepCodes) as string[],
  },
];

let failed = false;
for (const { label, file, codes } of checks) {
  const en = readLocale(file);
  const missing = codes.filter((code) => !(code in en));
  if (missing.length > 0) {
    failed = true;
    console.error(`✖ Missing English strings for ${label} (locales/en/${file}.json):`);
    for (const code of missing) console.error(`  - ${code}`);
  } else {
    console.log(`✓ All ${codes.length} ${label} have English strings.`);
  }
}

if (failed) process.exit(1);
