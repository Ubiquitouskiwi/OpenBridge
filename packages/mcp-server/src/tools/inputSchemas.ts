/**
 * Tool input schemas. They mirror `HouseholdProfile` from @openbridge/shared minus the
 * derived fields (`grossMonthlyIncomeCents`, `fplRegion`), which the engine computes. Every
 * `.describe()` is written for an LLM caller: what the field means, its unit, and what must
 * NOT be sent (no names, SSNs, or addresses: privacy-security.md).
 */
import * as z from 'zod/v4';

/** Bounds that keep one request small; the engine itself has no size limits. */
const MAX_MEMBERS = 30;
const MAX_INCOME_SOURCES = 50;
const MAX_LABEL_LENGTH = 32;
/** $10 million in cents: far above any program limit, low enough to reject nonsense. */
const MAX_CENTS = 1_000_000_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

export const isoDate = z
  .string()
  .regex(ISO_DATE, 'Use the format YYYY-MM-DD.')
  .refine(isRealDate, 'This is not a real calendar date.');

const cents = (what: string) =>
  z
    .number()
    .int()
    .min(0)
    .max(MAX_CENTS)
    .describe(`${what} In whole US cents (integer): $1,250.50 is 125050. Do not send dollars.`);

const memberLabel = z
  .string()
  .min(1)
  .max(MAX_LABEL_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/, 'Use a short label like "self" or "kid1", not a name.');

export const memberSchema = z.object({
  id: memberLabel.describe(
    'A short made-up label for this person, unique in the household, such as "self", ' +
      '"spouse", "kid1". Never a real name.',
  ),
  relationship: z
    .enum([
      'self',
      'spouse',
      'child',
      'parent',
      'sibling',
      'grandparent',
      'other_relative',
      'non_relative',
    ])
    .describe('How this person is related to the person asking. Exactly one member is "self".'),
  dateOfBirth: isoDate
    .optional()
    .describe(
      'Birth date as YYYY-MM-DD, if the person is comfortable sharing. Preferred over age.',
    ),
  age: z
    .number()
    .int()
    .min(0)
    .max(125)
    .optional()
    .describe('Age in whole years. Use when the birth date is not shared. Babies under 1 are 0.'),
  eligibilityStatus: z
    .enum([
      'us_citizen',
      'national',
      'lpr_5yr_plus',
      'lpr_under_5yr',
      'refugee_asylee_humanitarian',
      'other_qualified',
      'undocumented',
      'prefer_not_to_say',
    ])
    .optional()
    .describe(
      'Optional citizenship or immigration status. Leave it out, or use "prefer_not_to_say", ' +
        'if the person does not want to answer. Status alone never makes someone ineligible here.',
    ),
  employmentStatus: z
    .enum(['employed', 'unemployed', 'self_employed', 'retired', 'disabled', 'student'])
    .optional()
    .describe('Optional work status for this person.'),
  isDisabled: z.boolean().optional().describe('True if this person has a disability.'),
  isPregnant: z.boolean().optional().describe('True if this person is pregnant now.'),
  expectedChildren: z
    .number()
    .int()
    .min(1)
    .max(8)
    .optional()
    .describe('For a pregnant person: number of babies expected (default 1).'),
  isPostpartum: z
    .boolean()
    .optional()
    .describe('True if this person gave birth in about the last 6 months.'),
  isBreastfeeding: z
    .boolean()
    .optional()
    .describe('True if this person is breastfeeding a baby under 1 year old.'),
  isStudent: z.boolean().optional().describe('True if this person is a student.'),
  purchasesPreparesSeparately: z
    .boolean()
    .optional()
    .describe('True if this person buys and cooks food separately from the rest of the home.'),
  filesTaxes: z.boolean().optional().describe('Optional: true if this person files taxes.'),
  claimedAsDependentBy: memberLabel
    .optional()
    .describe('Optional: the id (label) of the member who claims this person on taxes.'),
});

export const incomeSourceSchema = z.object({
  type: z
    .enum([
      'wages',
      'self_employment',
      'social_security',
      'ssi',
      'unemployment',
      'child_support',
      'pension',
      'veterans_benefits',
      'workers_comp',
      'other',
    ])
    .describe('Kind of income. For self_employment, send the amount after business costs.'),
  amountCents: cents(
    'Amount received each time, at the given frequency. For "hourly", this is the hourly rate.',
  ),
  frequency: z
    .enum(['hourly', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'annual'])
    .describe(
      'How often amountCents is paid: hourly (needs hoursPerWeek), weekly, biweekly (every ' +
        'two weeks), semimonthly (twice a month), monthly, or annual. The server converts it.',
    ),
  hoursPerWeek: z
    .number()
    .min(0)
    .max(168)
    .optional()
    .describe('Required when frequency is "hourly": usual hours worked per week.'),
  earned: z
    .boolean()
    .describe('True for money from work (wages, self-employment). False for benefits or support.'),
  memberId: memberLabel
    .optional()
    .describe('Optional: the id (label) of the member who receives this income.'),
});

export const householdSchema = z
  .object({
    stateCode: z
      .string()
      .regex(/^[A-Za-z]{2}$/)
      .describe('Two-letter U.S. state code, such as "OH". See list_supported_states.'),
    county: z
      .string()
      .max(60)
      .optional()
      .describe('Optional county name only, for local links. Never a street address or ZIP.'),
    members: z
      .array(memberSchema)
      .min(1)
      .max(MAX_MEMBERS)
      .describe('Everyone who lives and eats together, including the person asking ("self").'),
    incomeSources: z
      .array(incomeSourceSchema)
      .max(MAX_INCOME_SOURCES)
      .describe('Every regular income in the household. Send an empty list if there is none.'),
    monthlyHousingCostCents: cents('Rent or mortgage paid each month.').optional(),
    monthlyUtilityCostCents: cents(
      'Heat, electric, water, and similar bills each month.',
    ).optional(),
    monthlyChildcareCostCents: cents('Child care or adult care paid each month.').optional(),
    monthlyChildSupportPaidCents: cents('Child support this household pays each month.').optional(),
    monthlyMedicalExpensesCents: cents(
      'Out-of-pocket medical costs each month for members 60+ or with a disability.',
    ).optional(),
    liquidAssetsCents: cents('Money in cash, checking, and savings, in total.').optional(),
    isStateResident: z
      .boolean()
      .optional()
      .describe('Whether the household lives in this state. Defaults to true.'),
    receivesCashAssistance: z
      .boolean()
      .optional()
      .describe('True if anyone already gets TANF or other cash assistance.'),
    receivesMedicaid: z.boolean().optional().describe('True if anyone already gets Medicaid.'),
    receivesSnap: z.boolean().optional().describe('True if the household already gets SNAP.'),
  })
  .describe(
    'The household to screen. Money is in integer US cents. Do NOT include names, Social ' +
      'Security numbers, street addresses, or phone numbers; they are not needed.',
  );

export type HouseholdInput = z.infer<typeof householdSchema>;

export const evaluationDateSchema = isoDate
  .optional()
  .describe(
    'Optional date to screen as of (YYYY-MM-DD). Leave it out to use today (UTC). ' +
      'Ages and rule freshness are worked out as of this date.',
  );
