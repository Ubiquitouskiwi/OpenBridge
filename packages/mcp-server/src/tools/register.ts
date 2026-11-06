/**
 * Registers the OpenBridge tools and the screening-guide prompt on an McpServer. All tools
 * are read-only, idempotent, and closed-world (no outside systems are touched).
 */
import type { McpServer, ToolAnnotations } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  DEFAULT_CLIFF_SCAN_MAX_CENTS,
  DEFAULT_CLIFF_SCAN_STEP_CENTS,
} from '@openbridge/eligibility-engine';
import { SCREENING_GUIDE } from '../copy.js';
import {
  type ToolContext,
  exploreIncomeChangeTool,
  getProgramRulesTool,
  listSupportedStatesTool,
  screenHouseholdTool,
} from './handlers.js';
import { evaluationDateSchema, householdSchema } from './inputSchemas.js';

const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

/** Upper bounds on the income-change scan, so one call stays cheap. */
const MAX_DELTAS = 20;
const MAX_DELTA_CENTS = 10_000_000; // $100,000 a month either way
const MAX_SCAN_INCREASE_CENTS = 1_000_000; // $10,000 a month
const MIN_SCAN_STEP_CENTS = 100; // $1, the engine's own minimum step
const MAX_SCAN_STEPS = 400;

const stateCodeSchema = z
  .string()
  .regex(/^[A-Za-z]{2}$/)
  .describe('Two-letter U.S. state code, such as "OH".');

const incomeChangeSchema = z
  .object({
    household: householdSchema,
    evaluationDate: evaluationDateSchema,
    deltasMonthlyCents: z
      .array(z.number().int().min(-MAX_DELTA_CENTS).max(MAX_DELTA_CENTS))
      .max(MAX_DELTAS)
      .optional()
      .describe(
        'Optional income changes to try, in integer cents per month. Positive is more income ' +
          '(for example 50000 is $500 more a month), negative is less. No change (0) is ' +
          'always included. Default: +$250, +$500, +$1,000.',
      ),
    scanMaxIncreaseCents: z
      .number()
      .int()
      .min(0)
      .max(MAX_SCAN_INCREASE_CENTS)
      .optional()
      .describe(
        'Optional: how far to look for benefit cliffs, in cents per month. Default $3,000.',
      ),
    scanStepCents: z
      .number()
      .int()
      .min(MIN_SCAN_STEP_CENTS)
      .max(MAX_SCAN_INCREASE_CENTS)
      .optional()
      .describe('Optional: size of each step in the cliff scan, in cents. Default $25.'),
  })
  .refine(
    (a) =>
      (a.scanMaxIncreaseCents ?? DEFAULT_CLIFF_SCAN_MAX_CENTS) /
        (a.scanStepCents ?? DEFAULT_CLIFF_SCAN_STEP_CENTS) <=
      MAX_SCAN_STEPS,
    { message: `The cliff scan may use at most ${MAX_SCAN_STEPS} steps. Use a larger step.` },
  );

export function registerOpenBridgeTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    'list_supported_states',
    {
      title: 'List supported states',
      description:
        'List the states OpenBridge has rules for, which programs each one covers, whether ' +
        'the rules are verified or still a draft, and the data version. Takes no input.',
      annotations: READ_ONLY,
    },
    async () => listSupportedStatesTool(ctx),
  );

  server.registerTool(
    'get_program_rules',
    {
      title: 'Get program rules for a state',
      description:
        "Show a state's rule values for each program (income limits as a percent of the " +
        'federal poverty line, money in cents) with the cited source for each value. Says ' +
        'clearly when the rules are a draft that experts have not checked.',
      inputSchema: z.object({ stateCode: stateCodeSchema }),
      annotations: READ_ONLY,
    },
    async (args) => getProgramRulesTool(ctx, args),
  );

  server.registerTool(
    'screen_household',
    {
      title: 'Screen a household for benefits',
      description:
        'Estimate whether a household may qualify for SNAP, Medicaid/CHIP, WIC, LIHEAP, and ' +
        'TANF. Returns, per program: an estimated outcome, plain-English reasons, the checks ' +
        'and math with cited sources, per-person results, next steps, and where to apply. ' +
        'Results are estimates, never a final decision. Do not send names, SSNs, or addresses.',
      inputSchema: z.object({ household: householdSchema, evaluationDate: evaluationDateSchema }),
      annotations: READ_ONLY,
    },
    async (args) => screenHouseholdTool(ctx, args),
  );

  server.registerTool(
    'explore_income_change',
    {
      title: 'Explore an income change',
      description:
        'Show how results may change if household income goes up or down (for example a ' +
        'raise or more hours), and find benefit cliffs: the income increase at which each ' +
        "program, or one person's coverage, becomes less sure or may stop. Same household " +
        'input as screen_household.',
      inputSchema: incomeChangeSchema,
      annotations: READ_ONLY,
    },
    async (args) => exploreIncomeChangeTool(ctx, args),
  );

  server.registerPrompt(
    'screening_guide',
    {
      title: 'Benefits screening guide',
      description: 'Start a respectful, private benefits screening conversation with OpenBridge.',
    },
    () => ({
      messages: [{ role: 'user', content: { type: 'text', text: SCREENING_GUIDE } }],
    }),
  );
}
