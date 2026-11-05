/**
 * Zod validation at the intake boundary (requirement 5.1/§7.1, design §5.2). Returns a
 * human-readable error message for the first problem, or null when the draft is valid.
 */
import { z } from 'zod';
import type { HouseholdProfile } from '@openbridge/shared';

const memberSchema = z
  .object({
    id: z.string(),
    relationship: z.string(),
    age: z.number().int().min(0).max(120).optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date of birth.')
      .optional(),
  })
  .refine((m) => m.age !== undefined || m.dateOfBirth !== undefined, {
    message: 'Each person needs an age or date of birth.',
  });

const incomeSchema = z
  .object({
    amountCents: z.number().int().min(0, 'Income cannot be negative.'),
    frequency: z.string(),
    hoursPerWeek: z.number().min(0).max(168).optional(),
  })
  .refine((s) => s.frequency !== 'hourly' || (s.hoursPerWeek ?? 0) > 0, {
    message: 'Enter hours per week for hourly income.',
  });

const profileSchema = z.object({
  stateCode: z.string().min(1, 'Please choose your state.'),
  members: z.array(memberSchema).min(1, 'Please add at least one person.'),
  incomeSources: z.array(incomeSchema),
});

/** Validate a draft profile; returns the first error message, or null if valid. */
export function validateProfile(draft: HouseholdProfile): string | null {
  const result = profileSchema.safeParse(draft);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Please check your answers.';
}
