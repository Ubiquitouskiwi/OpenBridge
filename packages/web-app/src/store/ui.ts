import { create } from 'zustand';

interface UiState {
  autoClearWarning: boolean;
  setAutoClearWarning: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  autoClearWarning: false,
  setAutoClearWarning: (autoClearWarning) => set({ autoClearWarning }),
}));
