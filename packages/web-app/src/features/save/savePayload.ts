import type { HouseholdProfile } from '@openbridge/shared';
import { federal } from '../../data/index.js';

export interface SavePayload {
  profile: HouseholdProfile;
  dataVersion: string;
  savedAt: string;
}

/** The dataVersion the app is currently shipping (design §6.2 stale-check on import). */
export function currentDataVersion(): string {
  return String(federal.fplTables.contiguous.year);
}

export function buildSavePayload(profile: HouseholdProfile): SavePayload {
  return { profile, dataVersion: currentDataVersion(), savedAt: new Date().toISOString() };
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, contents: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
