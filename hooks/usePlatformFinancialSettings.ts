import { useEffect, useState } from 'react';

interface FinancialSettings { currency: string; taxRate: number }
const defaults: FinancialSettings = { currency: 'XAF', taxRate: 19.25 };

function readSettings(): FinancialSettings {
  try {
    const general = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}').general || {};
    return {
      currency: typeof general.currency === 'string' ? general.currency : defaults.currency,
      taxRate: Number.isFinite(Number(general.taxRate)) ? Number(general.taxRate) : defaults.taxRate,
    };
  } catch { return defaults; }
}

export function usePlatformFinancialSettings() {
  const [settings, setSettings] = useState<FinancialSettings>(defaults);
  useEffect(() => {
    const sync = () => setSettings(readSettings());
    sync();
    window.addEventListener('idibages-settings-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('idibages-settings-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return settings;
}

export function formatPlatformCurrency(amount: number, currency: string) {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount); }
  catch { return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount); }
}
