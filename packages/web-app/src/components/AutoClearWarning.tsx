import { useUiStore } from '../store/ui.js';

/** Accessible "are you still there?" warning before an inactivity auto-clear (Q26). */
export function AutoClearWarning() {
  const warning = useUiStore((s) => s.autoClearWarning);
  if (!warning) return null;

  function stayActive() {
    // Simulate activity so the inactivity timer resets.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('click'));
  }

  return (
    <div className="auto-clear-warning" role="alertdialog" aria-labelledby="auto-clear-title">
      <p id="auto-clear-title">
        Are you still there? To protect your privacy, we'll clear your information soon.
      </p>
      <button type="button" onClick={stayActive}>
        I'm still here
      </button>
    </div>
  );
}
