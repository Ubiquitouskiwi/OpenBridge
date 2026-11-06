/**
 * Applies a rule-change proposal made with the community rule toolkit to a state adapter.
 *
 *   npm run rules:apply -- path/to/proposal.json            # apply and save
 *   npm run rules:apply -- path/to/proposal.json --dry-run  # show what would change
 *
 * The proposal is validated, checked against the adapter's current values (a proposal made
 * from older data is refused), applied with its citation, and the adapter is left `draft`.
 * Afterwards run `npm run validate:adapters` and `npm run test:fixtures`, add or update a golden
 * fixture, and open a pull request that links the proposal's source.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { z } from 'zod';
import { RULE_PROPOSAL_FORMAT, applyRuleProposal } from '@openbridge/shared';
import type { RuleProposal } from '@openbridge/shared';
import { DATA_DIR, loadStateAdapter } from './lib/loaders.js';

const ruleValue = z.union([z.number(), z.boolean(), z.null()]);

const proposalSchema = z.object({
  format: z.literal(RULE_PROPOSAL_FORMAT),
  stateCode: z.string().regex(/^[A-Za-z]{2}$/, 'stateCode must be a two-letter state code'),
  changes: z
    .array(
      z.object({ field: z.string().min(1), currentValue: ruleValue, proposedValue: ruleValue }),
    )
    .min(1)
    .max(50),
  source: z.object({
    sourceName: z.string().min(1).max(300),
    url: z.string().url(),
    publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'publishedDate must be YYYY-MM-DD'),
    note: z.string().max(2000).optional(),
  }),
  explanation: z.string().min(1).max(5000),
  createdWith: z.string().max(100).optional(),
});

const USAGE = [
  'Usage: npm run rules:apply -- <proposal.json> [--dry-run]',
  '',
  'Applies a rule proposal file from the community rule toolkit to data/states/<code>/adapter.json.',
  '  --dry-run   Show the changes without writing anything.',
  '  --help      Show this message.',
].join('\n');

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function readProposal(path: string): RuleProposal {
  if (!existsSync(path)) fail(`No file at ${path}`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(`${path} is not valid JSON.`);
  }
  const parsed = proposalSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(file)'}: ${i.message}`);
    fail(`${path} is not a valid rule proposal:\n  - ${issues.join('\n  - ')}`);
  }
  return parsed.data as RuleProposal;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return;
  }
  const dryRun = args.includes('--dry-run');
  const file = args.find((a) => !a.startsWith('-'));
  if (!file) fail(USAGE);

  const proposal = readProposal(resolve(file));
  const code = proposal.stateCode.toLowerCase();
  const adapterPath = join(DATA_DIR, 'states', code, 'adapter.json');
  if (!existsSync(adapterPath)) fail(`No adapter for ${proposal.stateCode} at ${adapterPath}`);

  const result = applyRuleProposal(loadStateAdapter(code), proposal);
  if (result.errors.length > 0) fail(`Proposal not applied:\n  - ${result.errors.join('\n  - ')}`);

  console.log(`Proposal for ${proposal.stateCode}: ${proposal.explanation}`);
  console.log(
    `Source: ${proposal.source.sourceName} (${proposal.source.publishedDate}) ${proposal.source.url}`,
  );
  for (const line of result.applied) console.log(`  ${line}`);
  if (dryRun) {
    console.log('Dry run: nothing was written.');
    return;
  }

  // Write through Prettier so the data file keeps the repository's formatting.
  const options = (await resolveConfig(adapterPath)) ?? {};
  const text = await format(JSON.stringify(result.adapter), { ...options, parser: 'json' });
  writeFileSync(adapterPath, text);
  console.log(`✓ Updated ${adapterPath} (verificationStatus stays "draft").`);
  console.log('Next: add or update a golden fixture, then run');
  console.log('  npm run validate:adapters && npm run test:fixtures');
}

void main();
