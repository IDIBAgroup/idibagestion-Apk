import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, RotateCcw, Palette, Building2, Cog, Save } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';

type SettingsTab = 'general' | 'theme' | 'workflows';

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function ColorWheel({ onChange, size = 180 }: { onChange: (hex: string) => void; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    // Inner white to transparent for saturation
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [size]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const handleInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;
    const distance = Math.sqrt(x * x + y * y);
    const radius = size / 2 - 4;
    const saturation = Math.min(100, (distance / radius) * 100);
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    const hex = hslToHex(angle, saturation, 50);
    onChange(hex);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full cursor-crosshair"
      style={{ width: size, height: size }}
      onMouseDown={(e) => { setIsDragging(true); handleInteraction(e); }}
      onMouseMove={(e) => { if (isDragging) handleInteraction(e); }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={(e) => { setIsDragging(true); handleInteraction(e); }}
      onTouchMove={(e) => { if (isDragging) handleInteraction(e); }}
      onTouchEnd={() => setIsDragging(false)}
    />
  );
}

export function SettingsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName, logo, primaryColor, secondaryColor, saturation, lightness, updateBranding, resetToDefault } = useBrandingStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  const [localSaturation, setLocalSaturation] = useState(saturation);
  const [localLightness, setLocalLightness] = useState(lightness);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCurrentPageTitle('Paramètres'); }, [setCurrentPageTitle]);

  const handleSave = () => {
    updateBranding({ companyName: localCompanyName, saturation: localSaturation, lightness: localLightness });
    showToast('Paramètres sauvegardés', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateBranding({ logo: ev.target?.result as string });
        showToast('Logo importé avec succès', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const presets = [
    { name: 'Émeraude', primary: '#2DD4A8', secondary: '#3B82F6' },
    { name: 'Bleu Océan', primary: '#0EA5E9', secondary: '#6366F1' },
    { name: 'Violet Tech', primary: '#A855F7', secondary: '#EC4899' },
    { name: 'Orange Énergie', primary: '#F97316', secondary: '#EAB308' },
  ];

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'Général', icon: <Building2 size={16} /> },
    { key: 'theme', label: 'Thème & Apparence', icon: <Palette size={16} /> },
    { key: 'workflows', label: 'Workflows', icon: <Cog size={16} /> },
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        {activeTab === 'general' && (
          <>
            <GlassCard>
              <div className="p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Informations Entreprise</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom de l&apos;entreprise</label>
                    <input
                      type="text"
                      value={localCompanyName}
                      onChange={(e) => setLocalCompanyName(e.target.value)}
                      className="w-full h-10 px-3 glass-input text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">RCCM</label>
                      <input type="text" defaultValue="RC/DLA/2020/B/1234" className="w-full h-10 px-3 glass-input text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">IDU</label>
                      <input type="text" defaultValue="IDU0123456789" className="w-full h-10 px-3 glass-input text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Devise par défaut</label>
                    <select className="w-full h-10 px-3 glass-input text-sm">
                      <option value="XAF">XAF (FCFA CEMAC)</option>
                      <option value="XOF">XOF (FCFA UEMOA)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="USD">USD (Dollar)</option>
                    </select>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Logo</h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--accent-primary)]/30 transition-colors"
                >
                  <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml" className="hidden" onChange={handleFileUpload} />
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-20 mx-auto object-contain" />
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">Cliquez pour importer un logo</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">PNG transparent ou SVG</p>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-end">
              <button onClick={handleSave} className="btn-primary h-10">
                <Save size={16} /> Sauvegarder
              </button>
            </div>
          </>
        )}

        {activeTab === 'theme' && (
          <>
            <GlassCard>
              <div className="p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Roue Chromatique Interactive</h3>
                <div className="flex flex-wrap gap-8 items-start">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-3">Cliquez et déplacez pour choisir la couleur</p>
                    <ColorWheel onChange={(hex) => updateBranding({ primaryColor: hex })} size={200} />
                  </div>
                  <div className="flex-1 space-y-4 min-w-[200px]">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">Couleur principale</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-[var(--glass-border)]" style={{ backgroundColor: primaryColor }} />
                        <code className="text-sm text-[var(--text-primary)] bg-[var(--bg-elevated)] px-2 py-1 rounded">{primaryColor}</code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">Saturation: {localSaturation}%</label>
                      <input
                        type="range" min="0" max="100" value={localSaturation}
                        onChange={(e) => { setLocalSaturation(Number(e.target.value)); updateBranding({ saturation: Number(e.target.value) }); }}
                        className="w-full accent-[var(--accent-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">Luminosité: {localLightness}%</label>
                      <input
                        type="range" min="0" max="100" value={localLightness}
                        onChange={(e) => { setLocalLightness(Number(e.target.value)); updateBranding({ lightness: Number(e.target.value) }); }}
                        className="w-full accent-[var(--accent-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">Presets</label>
                      <div className="flex gap-2">
                        {presets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => updateBranding({ primaryColor: preset.primary, secondaryColor: preset.secondary })}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors"
                          >
                            <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                            <span className="text-xs text-[var(--text-secondary)]">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={resetToDefault} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors">
                      <RotateCcw size={12} /> Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Live Preview */}
            <GlassCard>
              <div className="p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Aperçu en temps réel</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: `${primaryColor}15` }}>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Bouton primaire</p>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: primaryColor, color: '#0B0F14' }}>
                      Exemple
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Badge de statut</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium" style={{ background: `${primaryColor}20`, color: primaryColor }}>
                      Actif
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Barre de progression</p>
                    <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: primaryColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'workflows' && (
          <GlassCard>
            <div className="p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Workflows Automatisés</h3>
              <div className="space-y-3">
                {[
                  { name: 'Relance factures en retard', trigger: 'Facture en retard > 7 jours', action: 'Envoi email relance', active: true },
                  { name: 'Notification échéance projet', trigger: 'Date échéance - 3 jours', action: 'Notification équipe', active: true },
                  { name: 'Amortissement mensuel', trigger: '1er du mois', action: 'Génération écriture comptable', active: true },
                  { name: 'Onboarding nouveau collaborateur', trigger: 'Nouvel employé créé', action: 'Création tâches RH + IT', active: false },
                ].map((wf, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${wf.active ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-muted)]'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{wf.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{wf.trigger} → {wf.action}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      wf.active ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                    }`}>
                      {wf.active ? 'Actif' : 'Inactif'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
