import { useEffect, useState } from 'react';
import {
  getAuthScreen,
  loadAuthScreen,
  type AuthScreenConfig,
} from '../data/auth-screen';

export function useAuthScreen(): AuthScreenConfig {
  const [config, setConfig] = useState<AuthScreenConfig>(() => getAuthScreen());

  useEffect(() => {
    let cancelled = false;
    void loadAuthScreen().then((next) => {
      if (!cancelled) setConfig(next);
    });
    const refresh = () => setConfig(getAuthScreen());
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void loadAuthScreen().then((next) => {
        if (!cancelled) setConfig(next);
      });
    };
    window.addEventListener('hamel-auth-screen-updated', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-auth-screen-updated', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return config;
}
