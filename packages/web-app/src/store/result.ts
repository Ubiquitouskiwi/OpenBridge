import { create } from 'zustand';
import type { EligibilityResult } from '@openbridge/shared';

interface ResultState {
  result: EligibilityResult | null;
  setResult: (result: EligibilityResult | null) => void;
  clear: () => void;
}

export const useResultStore = create<ResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clear: () => set({ result: null }),
}));
