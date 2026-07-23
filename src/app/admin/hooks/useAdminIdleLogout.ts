import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { signOutAdmin } from '../lib/admin-auth';

const IDLE_MS = 15 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel',
];

/** Signs the admin out after `IDLE_MS` with no user activity. */
export function useAdminIdleLogout(enabled: boolean) {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let loggingOut = false;

    const clearTimer = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const logout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      clearTimer();
      await signOutAdmin();
      navigate('/admin/login', { replace: true, state: { idleLogout: true } });
    };

    const arm = () => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        void logout();
      }, IDLE_MS);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      arm();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onActivity();
    };

    arm();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, navigate]);
}
