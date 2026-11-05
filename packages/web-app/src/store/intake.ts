import { create } from 'zustand';
import type { HouseholdMember, HouseholdProfile, IncomeSource } from '@openbridge/shared';

/** A fresh, empty intake draft. Data lives only in memory (Q26). */
export function emptyProfile(): HouseholdProfile {
  return {
    members: [],
    incomeSources: [],
    grossMonthlyIncomeCents: 0,
    county: '',
    stateCode: '',
    fplRegion: 'contiguous',
    isStateResident: true,
  };
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

interface IntakeState {
  draft: HouseholdProfile;
  setField: <K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) => void;
  addMember: (member: HouseholdMember) => void;
  updateMember: (id: string, patch: Partial<HouseholdMember>) => void;
  removeMember: (id: string) => void;
  addIncome: (source: IncomeSource) => void;
  updateIncome: (index: number, patch: Partial<IncomeSource>) => void;
  removeIncome: (index: number) => void;
  reset: () => void;
}

export const useIntakeStore = create<IntakeState>((set) => ({
  draft: emptyProfile(),
  setField: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  addMember: (member) =>
    set((s) => ({ draft: { ...s.draft, members: [...s.draft.members, member] } })),
  updateMember: (id, patch) =>
    set((s) => ({
      draft: {
        ...s.draft,
        members: s.draft.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      },
    })),
  removeMember: (id) =>
    set((s) => ({ draft: { ...s.draft, members: s.draft.members.filter((m) => m.id !== id) } })),
  addIncome: (source) =>
    set((s) => ({ draft: { ...s.draft, incomeSources: [...s.draft.incomeSources, source] } })),
  updateIncome: (index, patch) =>
    set((s) => ({
      draft: {
        ...s.draft,
        incomeSources: s.draft.incomeSources.map((src, i) =>
          i === index ? { ...src, ...patch } : src,
        ),
      },
    })),
  removeIncome: (index) =>
    set((s) => ({
      draft: { ...s.draft, incomeSources: s.draft.incomeSources.filter((_, i) => i !== index) },
    })),
  reset: () => set({ draft: emptyProfile() }),
}));
