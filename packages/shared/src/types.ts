/**
 * Core domain types for OpenBridge. See requirements.md §10.
 *
 * Money convention: all monetary values in this codebase are integer USD **cents**
 * unless a field name ends in `Pct` (a percentage of the Federal Poverty Level) or is
 * explicitly documented otherwise. Use the helpers in `money.ts` for conversions.
 */

export type ProgramId =
  'snap' | 'medicaid' | 'chip' | 'wic' | 'liheap' | 'tanf' | 'ui' | 'ssi_ssdi';

export type FplRegion = 'contiguous' | 'alaska' | 'hawaii';

export type AppMode = 'individual' | 'navigator';

export type EligibilityStatus =
  | 'us_citizen'
  | 'national'
  | 'lpr_5yr_plus'
  | 'lpr_under_5yr'
  | 'refugee_asylee_humanitarian'
  | 'other_qualified'
  | 'undocumented'
  | 'prefer_not_to_say';

export type EmploymentStatus =
  'employed' | 'unemployed' | 'self_employed' | 'retired' | 'disabled' | 'student';

export type Relationship =
  | 'self'
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'other_relative'
  | 'non_relative';

export interface HouseholdMember {
  id: string;
  relationship: Relationship;
  /** ISO date (YYYY-MM-DD). Preferred over `age`. */
  dateOfBirth?: string;
  /** Fallback when `dateOfBirth` is absent; boundary cases are flagged possibly_eligible. */
  age?: number;
  /** Replaces the old isCitizen boolean; never disqualifies on its own (Q17). */
  eligibilityStatus?: EligibilityStatus;
  /** Per-member so ABAWD / UI can reason about who works (Q36). */
  employmentStatus?: EmploymentStatus;
  isDisabled?: boolean;
  isPregnant?: boolean;
  /** Expected number of children for a pregnant member (default 1) — affects MAGI size. */
  expectedChildren?: number;
  /** WIC category: gave birth within roughly the last 6 months (clinic confirms exact window). */
  isPostpartum?: boolean;
  /** WIC category: currently breastfeeding an infant under 1 (clinic confirms exact window). */
  isBreastfeeding?: boolean;
  isStudent?: boolean;
  /** SNAP: this member customarily purchases and prepares food separately. */
  purchasesPreparesSeparately?: boolean;
  /** Optional MAGI tax signal (Q/design §3.3): does this member file taxes? */
  filesTaxes?: boolean;
  /** Optional MAGI tax signal: id of the member who claims this member as a dependent. */
  claimedAsDependentBy?: string;
}

export type IncomeSourceType =
  | 'wages'
  | 'self_employment'
  | 'social_security'
  | 'ssi'
  | 'unemployment'
  | 'child_support'
  | 'pension'
  | 'veterans_benefits'
  | 'workers_comp'
  | 'other';

export type IncomeFrequency =
  'hourly' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annual';

export interface IncomeSource {
  type: IncomeSourceType;
  /** Amount in cents at the given frequency (for self_employment this is NET). */
  amountCents: number;
  frequency: IncomeFrequency;
  /** Required when frequency = 'hourly'. */
  hoursPerWeek?: number;
  /** Drives the SNAP earned-income deduction. */
  earned: boolean;
  /** Optional attribution; when absent, member-level results downgrade (Q36). */
  memberId?: string;
}

export interface HouseholdProfile {
  members: HouseholdMember[];
  incomeSources: IncomeSource[];
  /** Derived = sum of normalized monthly amounts (cents). */
  grossMonthlyIncomeCents: number;
  monthlyHousingCostCents?: number;
  monthlyUtilityCostCents?: number;
  monthlyChildcareCostCents?: number;
  monthlyChildSupportPaidCents?: number;
  monthlyMedicalExpensesCents?: number;
  liquidAssetsCents?: number;
  /** Local routing/links; not used in Phase 1 math. */
  county: string;
  stateCode: string;
  /** Derived from stateCode via regionForState(). */
  fplRegion: FplRegion;
  /** Attested via state selection; default true (Q42). */
  isStateResident?: boolean;
  receivesCashAssistance?: boolean;
  receivesMedicaid?: boolean;
  receivesSnap?: boolean;
}

export type EligibilityOutcome =
  'eligible' | 'likely_eligible' | 'possibly_eligible' | 'ineligible' | 'unknown';

export interface ReasonCode {
  code: string;
  params: Record<string, string | number>;
}

export interface FactorRow {
  labelCode: string;
  value: string;
  threshold: string;
  passes: boolean;
}

/** Unit of a calculation-step value: integer cents, a percentage, or a count. */
export type CalculationUnit = 'cents' | 'pct' | 'count';

/**
 * How a step relates to the arithmetic around it, so the UI can lay out "show the math":
 * `input` is a value from the household, `rule` a value from reference data, `add` and
 * `subtract` adjust a running total, `result` is a computed subtotal, and `limit` is the
 * threshold the result is compared against.
 */
export type CalculationOp = 'input' | 'rule' | 'add' | 'subtract' | 'result' | 'limit';

/** Where a rule value comes from: a `sources[].field` in the state adapter or federal data. */
export interface CalculationSourceRef {
  scope: 'state' | 'federal';
  field: string;
}

/**
 * One step of an evaluator's arithmetic (the "show the math" trace). Steps carry codes and
 * raw values only; the UI localizes and formats them, like reason codes.
 */
export interface CalculationStep {
  labelCode: string;
  value: number;
  unit: CalculationUnit;
  op: CalculationOp;
  source?: CalculationSourceRef;
}

/** Present for per-member programs (Medicaid, CHIP, WIC). */
export interface MemberEligibility {
  memberId: string;
  outcome: EligibilityOutcome;
  reasons: ReasonCode[];
  factors: FactorRow[];
  estimatedBenefitCents?: number;
  /** Step-by-step arithmetic behind this member's result. */
  calculation?: CalculationStep[];
}

export interface ProgramEligibilityResult {
  programId: ProgramId;
  scope: 'household' | 'per_member';
  outcome: EligibilityOutcome;
  reasons: ReasonCode[];
  factors: FactorRow[];
  memberResults?: MemberEligibility[];
  estimatedBenefitCents?: number;
  fplCalculation: FplCalculation;
  nextStepCodes: string[];
  applyUrl: string;
  requiredDocumentCodes: string[];
  /** Step-by-step arithmetic behind a household-scoped result. */
  calculation?: CalculationStep[];
}

export interface FplCalculation {
  householdSize: number;
  region: FplRegion;
  /** Annual FPL for the household size, in cents. */
  fplAnnualCents: number;
  /** Household annual income as a percentage of FPL. */
  percentageOfFpl: number;
}

export interface EligibilityResult {
  profile: HouseholdProfile;
  results: ProgramEligibilityResult[];
  /** ISO snapshot used for reproducible age/results. */
  evaluationDate: string;
  rulesLastUpdated: string;
  dataVersion: string;
}

/* ------------------------------------------------------------------ */
/* State adapter + program configs (requirements §10, design §4)       */
/* ------------------------------------------------------------------ */

export interface ProvenanceSource {
  field: string;
  sourceName: string;
  url: string;
  publishedDate: string;
  note?: string;
}

export interface SnapStateConfig {
  /** Broad-based categorical eligibility (waives net-income + asset tests, raises gross limit). */
  bbce: boolean;
  grossIncomeLimitPct: number;
  /** Net income limit; null when waived under BBCE. */
  netIncomeLimitPct: number | null;
  /** Asset limit in cents; null when waived under BBCE. */
  assetLimitCents: number | null;
  assetLimitElderlyDisabledCents: number | null;
  hasVehicleAssetTest: boolean;
}

export interface MedicaidChildTier {
  /** Inclusive upper age bound for this tier. */
  maxAgeInclusive: number;
  limitPct: number;
}

export interface MedicaidStateConfig {
  expansion: boolean;
  /** Adult (expansion) limit; low or 0 in non-expansion states. */
  adultLimitPct: number;
  parentCaretakerLimitPct: number;
  pregnantLimitPct: number;
  childTiers: MedicaidChildTier[];
}

export interface WicStateConfig {
  incomeLimitPct: number;
}

export interface LiheapStateConfig {
  incomeLimitPct: number;
  categoricalIfSnap: boolean;
}

export interface TanfStateConfig {
  baseMonthlyLimitCents: number;
  perAdditionalPersonCents: number;
}

export interface StateAdapter {
  stateCode: string;
  stateName: string;
  medicaidExpansion: boolean;
  programs: {
    snap?: SnapStateConfig;
    medicaid?: MedicaidStateConfig;
    wic?: WicStateConfig;
    liheap?: LiheapStateConfig;
    tanf?: TanfStateConfig;
  };
  portalUrls: Partial<Record<ProgramId, string>>;
  sources: ProvenanceSource[];
  verificationStatus: 'verified' | 'draft';
  lastVerified: string;
  lastVerifiedBy: string;
}

/* ------------------------------------------------------------------ */
/* Federal reference data (design §4.3)                                */
/* ------------------------------------------------------------------ */

export interface FplTable {
  region: FplRegion;
  year: number;
  /** Annual FPL for a 1-person household (cents). */
  baseAnnualCents: number;
  /** Added per additional household member (cents). */
  perAdditionalPersonCents: number;
  effectiveDate: string;
  expectedRefreshDate: string;
}

export interface SnapFederalData {
  /** Max monthly allotment by household size (index 1..N; index 0 unused), cents. */
  maxAllotmentByHouseholdSizeCents: number[];
  /** Standard deduction by household size (index 1..N), cents. */
  standardDeductionByHouseholdSizeCents: number[];
  earnedIncomeDeductionRate: number;
  benefitReductionRate: number;
  /** Excess-shelter deduction cap for non-elderly/disabled households (cents). */
  shelterCapCents: number;
  /** Medical-expense deduction threshold for elderly/disabled members (cents). */
  medicalDeductionThresholdCents: number;
  /** Minimum benefit for 1–2 person households (cents). */
  minBenefit1to2Cents: number;
  /** ABAWD work-rule age range, inclusive (Fiscal Responsibility Act of 2023: 18–54). */
  abawdMinAge: number;
  abawdMaxAge: number;
  /** Age at which a member counts as elderly for SNAP deductions/asset limits. */
  elderlyAge: number;
  effectiveDate: string;
  expectedRefreshDate: string;
}

export interface FederalData {
  fplTables: Record<FplRegion, FplTable>;
  snap: SnapFederalData;
  sources: ProvenanceSource[];
}

/* ------------------------------------------------------------------ */
/* Referral + deployment (requirements §10)                            */
/* ------------------------------------------------------------------ */

export interface ReferralEntry {
  type: 'legal_aid' | 'gov' | 'bar_referral' | 'firm';
  name: string;
  coverageArea: string;
  categories: string[];
  languages: string[];
  phone?: string;
  email?: string;
  url?: string;
  lastVerified: string;
}

export interface DeploymentConfig {
  orgName?: string;
  contact?: string;
  defaultMode: AppMode;
  autoClearTimeoutSeconds: number;
  localResources?: { label: string; url: string }[];
}
