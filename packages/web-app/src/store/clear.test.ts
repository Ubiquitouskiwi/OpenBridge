/**
 * The panic control / auto-clear must wipe EVERY store that can hold PII,
 * including the navigator-mode client batch (Q26, requirement 5.7).
 */
import { describe, it, expect } from 'vitest';
import type { EligibilityResult } from '@openbridge/shared';
import { clearAllData } from './clear.js';
import { useIntakeStore } from './intake.js';
import { useResultStore } from './result.js';
import { useDashboardStore } from './dashboard.js';

function fakeResult(): EligibilityResult {
  return {
    profile: {
      members: [{ id: 'm1', relationship: 'self', age: 30 }],
      incomeSources: [],
      grossMonthlyIncomeCents: 100000,
      county: 'Franklin',
      stateCode: 'OH',
      fplRegion: 'contiguous',
    },
    results: [],
    evaluationDate: '2026-07-14',
    rulesLastUpdated: '2024-01-17',
    dataVersion: '2024',
  };
}

describe('clearAllData', () => {
  it('wipes intake, result, and dashboard stores', () => {
    useIntakeStore.getState().addMember({ id: 'm1', relationship: 'self', age: 30 });
    useResultStore.getState().setResult(fakeResult());
    useDashboardStore.getState().addClient(fakeResult(), 'Client A');

    expect(useIntakeStore.getState().draft.members).toHaveLength(1);
    expect(useResultStore.getState().result).not.toBeNull();
    expect(useDashboardStore.getState().clients).toHaveLength(1);

    clearAllData();

    expect(useIntakeStore.getState().draft.members).toHaveLength(0);
    expect(useResultStore.getState().result).toBeNull();
    expect(useDashboardStore.getState().clients).toHaveLength(0);
  });
});
