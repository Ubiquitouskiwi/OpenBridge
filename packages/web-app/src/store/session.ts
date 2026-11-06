import { create } from 'zustand';
import type { AppMode, DeploymentConfig } from '@openbridge/shared';
import { defaultDeploymentConfig } from '../data/index.js';
import type { Language } from '../i18n/config.js';

interface SessionState {
  mode: AppMode;
  language: Language;
  deployment: DeploymentConfig;
  setMode: (mode: AppMode) => void;
  setLanguage: (language: Language) => void;
  setDeployment: (deployment: DeploymentConfig) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  mode: defaultDeploymentConfig.defaultMode,
  language: 'en',
  deployment: defaultDeploymentConfig,
  setMode: (mode) => set({ mode }),
  setLanguage: (language) => set({ language }),
  setDeployment: (deployment) => set({ deployment, mode: deployment.defaultMode }),
}));

/**
 * Optionally load a per-deployment config override (Q35). Self-hosters can place a
 * `deployment-config.json` at the site root; failures are ignored (the file is optional).
 */
export async function loadDeploymentConfigOverride(): Promise<void> {
  // The single-file local build runs from disk with no server to hold a config file.
  if (typeof fetch === 'undefined' || import.meta.env.MODE === 'standalone') return;
  try {
    const res = await fetch('/deployment-config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const cfg = (await res.json()) as Partial<DeploymentConfig>;
    if (typeof cfg.defaultMode === 'string' && typeof cfg.autoClearTimeoutSeconds === 'number') {
      useSessionStore
        .getState()
        .setDeployment({ ...defaultDeploymentConfig, ...cfg } as DeploymentConfig);
    }
  } catch {
    // Optional file; ignore.
  }
}
