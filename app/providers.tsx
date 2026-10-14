'use client';

import { useEffect, type ReactNode } from 'react';
import { TRPCProvider } from '@/providers/trpc';
import { installLiveTranslation } from '@/lib/liveTranslation';
import { PwaSupport } from '@/components/pwa/PwaSupport';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const branding = localStorage.getItem('idibages-branding');
      if (!branding) return;
      const parsed = JSON.parse(branding);
      if (parsed.state?.primaryColor) {
        document.documentElement.style.setProperty('--accent-primary', parsed.state.primaryColor);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => installLiveTranslation(), []);

  return <TRPCProvider>{children}<PwaSupport /></TRPCProvider>;
}
