import { create } from 'zustand';
import type { EligibilityResult } from '@openbridge/shared';

export interface DashboardClient {
  id: string;
  label: string;
  result: EligibilityResult;
}

interface DashboardState {
  clients: DashboardClient[];
  addClient: (result: EligibilityResult, label?: string) => void;
  removeClient: (id: string) => void;
  clearAll: () => void;
}

let seq = 0;

/**
 * Navigator-mode batch screening (requirement 5.11, Q41). Multiple client sessions are held
 * IN MEMORY under the navigator's control for the active session. Nothing is persisted to disk.
 */
export const useDashboardStore = create<DashboardState>((set, get) => ({
  clients: [],
  addClient: (result, label) => {
    seq += 1;
    const client: DashboardClient = {
      id: `client-${seq}`,
      label: label ?? `Client ${get().clients.length + 1}`,
      result,
    };
    set((s) => ({ clients: [...s.clients, client] }));
  },
  removeClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
  clearAll: () => set({ clients: [] }),
}));
