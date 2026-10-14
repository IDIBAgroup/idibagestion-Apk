import type { PlatformLanguage } from '@/lib/i18n';
import { useBrandingStore } from '@/stores/brandingStore';

export function applyPlatformLanguage(language: PlatformLanguage) {
  useBrandingStore.getState().updateBranding({ language });
  try {
    const saved = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}');
    localStorage.setItem('idibages_settings_v1', JSON.stringify({
      ...saved,
      general: { ...(saved.general || {}), language },
      appearance: { ...(saved.appearance || {}), language },
    }));
    window.dispatchEvent(new Event('idibages-settings-updated'));
  } catch {
    // Branding store remains the source of truth if older settings are malformed.
  }
}
