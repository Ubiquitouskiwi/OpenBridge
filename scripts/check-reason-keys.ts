/**
 * Fails if any engine reason code lacks an English string (requirement 5.9.4, Q25).
 * English is the enforced base locale; other locales only warn (checked at review time).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReasonCodes } from '@openbridge/shared';

const here = dirname(fileURLToPath(import.meta.url));
const enPath = resolve(here, '../packages/web-app/src/i18n/locales/en/reasons.json');
const en = JSON.parse(readFileSync(enPath, 'utf8')) as Record<string, string>;

const missing = Object.values(ReasonCodes).filter((code) => !(code in en));

if (missing.length > 0) {
  console.error('✖ Missing English strings for reason codes:');
  for (const code of missing) console.error(`  - ${code}`);
  process.exit(1);
}

console.log(`✓ All ${Object.values(ReasonCodes).length} reason codes have English strings.`);
