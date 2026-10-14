import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, Mail, Phone, MapPin, Globe, Lock,
  Save, CheckCircle, AlertTriangle, Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';
import { updatePortalAccount, changePortalPassword } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import type { PortalUser } from '@/types';

interface Props {
  portalUser: PortalUser;
  themeColor: 'blue' | 'emerald' | 'purple';
  onUpdate: (user: PortalUser) => void;
}

export function PortalSettings({ portalUser, themeColor, onUpdate }: Props) {
  const { showToast } = useUIStore();
  const [form, setForm] = useState({
    displayName: portalUser.displayName,
    email: portalUser.email,
    phone: portalUser.phone || '',
    companyName: portalUser.companyName,
    address: portalUser.address || '',
    city: portalUser.city || '',
    country: portalUser.country || '',
    ifu: portalUser.ifu || '',
    rccm: portalUser.rccm || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [saved, setSaved] = useState(false);

  const colors = {
    blue:    { bg: 'bg-blue-500',    bgLight: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30' },
    emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    purple:  { bg: 'bg-purple-500',  bgLight: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  }[themeColor];

  const handleSave = () => {
    updatePortalAccount(portalUser.id, {
      displayName: form.displayName,
      email: form.email,
      phone: form.phone,
      companyName: form.companyName,
      address: form.address,
      city: form.city,
      country: form.country,
      ifu: form.ifu,
      rccm: form.rccm,
    });
    const updated = { ...portalUser, ...form };
    onUpdate(updated);
    setSaved(true);
    showToast('Profil mis à jour avec succès', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (passwordForm.new.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    changePortalPassword(portalUser.id, passwordForm.new);
    setPasswordForm({ current: '', new: '', confirm: '' });
    showToast('Mot de passe modifié avec succès', 'success');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Shield size={20} className="text-[var(--accent-primary)]" /> Paramètres du compte
      </h2>

      {/* Informations personnelles */}
      <GlassCard><div className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <User size={16} className={colors.text} /> Informations personnelles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Nom complet</label>
            <input
              value={form.displayName}
              onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Téléphone</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Entreprise</label>
            <input
              value={form.companyName}
              onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>
      </div></GlassCard>

      {/* Coordonnées */}
      <GlassCard><div className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <MapPin size={16} className={colors.text} /> Coordonnées
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Adresse</label>
            <input
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Ville</label>
            <input
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Pays</label>
            <input
              value={form.country}
              onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">IFU</label>
              <input
                value={form.ifu}
                onChange={e => setForm(p => ({ ...p, ifu: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">RCCM</label>
              <input
                value={form.rccm}
                onChange={e => setForm(p => ({ ...p, rccm: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>
      </div></GlassCard>

      {/* Sécurité */}
      <GlassCard><div className="p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Lock size={16} className={colors.text} /> Sécurité
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Mot de passe actuel</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Nouveau mot de passe</label>
            <input
              type="password"
              value={passwordForm.new}
              onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Confirmer</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={!passwordForm.new || !passwordForm.confirm}
          className="mt-3 px-4 py-2 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] border border-[var(--divider)] hover:bg-white/5 transition-colors disabled:opacity-40"
        >
          Changer le mot de passe
        </button>
      </div></GlassCard>

      {/* Save button */}
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className={cn(
            "px-6 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2 transition-colors",
            colors.bg, "hover:opacity-90"
          )}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Enregistré !' : 'Enregistrer les modifications'}
        </motion.button>
      </div>
    </div>
  );
}
