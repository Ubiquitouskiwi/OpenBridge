import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session.js';
import { useUiStore } from '../store/ui.js';
import { clearAllData } from '../store/clear.js';

const WARN_WINDOW_SECONDS = 30;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart'];

/**
 * Individual-mode shared-device hygiene (requirement 5.7, Q26): after inactivity we warn,
 * then wipe all in-memory data and return home. Navigator mode opts out (manual control).
 */
export function useInactivityAutoClear(): void {
  const mode = useSessionStore((s) => s.mode);
  const timeoutSeconds = useSessionStore((s) => s.deployment.autoClearTimeoutSeconds);
  const setWarning = useUiStore((s) => s.setAutoClearWarning);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode !== 'individual' || typeof window === 'undefined') return;

    let last = Date.now();
    let warned = false;
    const warnAtMs = Math.max(0, timeoutSeconds - WARN_WINDOW_SECONDS) * 1000;
    const clearAtMs = timeoutSeconds * 1000;

    const reset = () => {
      last = Date.now();
      if (warned) {
        warned = false;
        setWarning(false);
      }
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - last;
      if (elapsed >= clearAtMs) {
        clearAllData();
        setWarning(false);
        warned = false;
        last = Date.now();
        navigate('/');
      } else if (elapsed >= warnAtMs && !warned) {
        warned = true;
        setWarning(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [mode, timeoutSeconds, navigate, setWarning]);
}
