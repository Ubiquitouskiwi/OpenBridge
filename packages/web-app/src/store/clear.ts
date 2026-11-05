import { useIntakeStore } from './intake.js';
import { useResultStore } from './result.js';
import { useDashboardStore } from './dashboard.js';

/**
 * Wipes all in-memory personal data (Q26). Used by the panic control and the
 * inactivity auto-clear. This must clear every store that can hold PII, including
 * the navigator-mode client batch. Session preferences (mode/language) are kept.
 */
export function clearAllData(): void {
  useIntakeStore.getState().reset();
  useResultStore.getState().clear();
  useDashboardStore.getState().clearAll();
}
