'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { OHADA_COUNTRIES, OHADA_INDUSTRIES, getOhadaCountryDefaults, type OhadaCountryCode, type OhadaCurrencyCode, type OhadaIndustryCode, type OhadaLocale } from '@/lib/ohada/countries';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useUIStore } from '@/stores/uiStore';

type FormState = {
  countryCode: OhadaCountryCode;
  currencyCode: OhadaCurrencyCode;
  timezone: string;
  locale: OhadaLocale;
  fiscalYearStartMonth: number;
  fiscalYearStartDay: number;
  industryCode: OhadaIndustryCode;
  customIndustryName: string;
};
type TaxType = 'vat' | 'withholding' | 'excise' | 'corporate_income' | 'payroll_income' | 'employee_social' | 'employer_social' | 'other';

const initial: FormState = {
  ...getOhadaCountryDefaults('CM'),
  customIndustryName: '',
};

export function CompanyOperatingProfile() {
  const { companyId } = useActiveCompany();
  const { showToast } = useUIStore();
  const utils = trpc.useUtils();
  const profile = trpc.company.profile.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const accessRole = trpc.company.accessRole.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const taxRules = trpc.company.taxRules.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const [form, setForm] = useState<FormState>(initial);
  const [taxForm, setTaxForm] = useState<{ code: string; name: string; taxType: TaxType; ratePercent: string; effectiveFrom: string; effectiveTo: string }>({ code: 'VAT_STANDARD', name: 'TVA', taxType: 'vat', ratePercent: '', effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '' });
  const canManage = ['owner', 'admin', 'platform_admin'].includes(accessRole.data ?? '');

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      countryCode: profile.data.countryCode as OhadaCountryCode,
      currencyCode: profile.data.currencyCode as OhadaCurrencyCode,
      timezone: profile.data.timezone,
      locale: profile.data.locale as OhadaLocale,
      fiscalYearStartMonth: profile.data.fiscalYearStartMonth,
      fiscalYearStartDay: profile.data.fiscalYearStartDay,
      industryCode: profile.data.industryCode as OhadaIndustryCode,
      customIndustryName: profile.data.customIndustryName ?? '',
    });
  }, [profile.data]);

  const saveProfile = trpc.company.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.company.profile.invalidate({ companyId: companyId ?? 0 });
      await utils.company.mine.invalidate();
      showToast('Profil comptable et opérationnel enregistré.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const createTaxRule = trpc.company.createTaxRule.useMutation({
    onSuccess: async () => {
      setTaxForm((current) => ({ ...current, code: '', name: '', ratePercent: '', effectiveTo: '' }));
      await utils.company.taxRules.invalidate({ companyId: companyId ?? 0 });
      showToast('Règle fiscale enregistrée avec ses dates d’application.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const archiveTaxRule = trpc.company.archiveTaxRule.useMutation({
    onSuccess: async () => {
      await utils.company.taxRules.invalidate({ companyId: companyId ?? 0 });
      showToast('Règle désactivée. Son historique est conservé.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const country = useMemo(() => OHADA_COUNTRIES.find((item) => item.code === form.countryCode) ?? OHADA_COUNTRIES[2], [form.countryCode]);

  function changeCountry(countryCode: OhadaCountryCode) {
    const defaults = getOhadaCountryDefaults(countryCode);
    setForm((current) => ({
      ...current,
      countryCode,
      currencyCode: defaults.currencyCode,
      timezone: defaults.timezone,
      locale: defaults.locale,
    }));
  }

  const fieldClass = 'h-10 w-full rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]';
  const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

  return (
    <section className="rounded border border-[var(--glass-border)] bg-[var(--bg-card)] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Cadre OHADA et activité</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
            Ces paramètres sont enregistrés pour l’entreprise et serviront aux documents, à la comptabilité et aux règles locales. Le référentiel SYSCOHADA révisé est commun ; la fiscalité et les règles sociales seront configurées séparément selon le pays et leur période d’application.
          </p>
        </div>
        <span className="rounded bg-[var(--accent-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent-primary)]">SYSCOHADA révisé</span>
      </div>

      {profile.isLoading ? <div className="h-32 animate-pulse rounded bg-[var(--bg-card-hover)]" /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label>
              <span className={labelClass}>Pays membre de l’OHADA</span>
              <select className={fieldClass} value={form.countryCode} disabled={!canManage || saveProfile.isPending} onChange={(event) => changeCountry(event.target.value as OhadaCountryCode)}>
                {OHADA_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Devise de tenue</span>
              <select className={fieldClass} value={form.currencyCode} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, currencyCode: event.target.value as OhadaCurrencyCode })}>
                {[...new Set(OHADA_COUNTRIES.map((item) => item.currency))].map((currency) => <option key={currency} value={currency}>{currency}{currency === country.currency ? ' · devise du pays' : ''}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Secteur d’activité</span>
              <select className={fieldClass} value={form.industryCode} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, industryCode: event.target.value as OhadaIndustryCode })}>
                {OHADA_INDUSTRIES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
            {form.industryCode === 'other' && <label>
              <span className={labelClass}>Précisez l’activité</span>
              <input className={fieldClass} maxLength={120} value={form.customIndustryName} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, customIndustryName: event.target.value })} placeholder="Activité de l’entreprise" />
            </label>}
            <label>
              <span className={labelClass}>Fuseau horaire</span>
              <input className={fieldClass} value={form.timezone} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Langue régionale par défaut</span>
              <select className={fieldClass} value={form.locale} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, locale: event.target.value as OhadaLocale })}>
                {[...new Set(OHADA_COUNTRIES.map((item) => item.locale))].map((locale) => <option key={locale} value={locale}>{locale}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Mois de début d’exercice</span>
              <select className={fieldClass} value={form.fiscalYearStartMonth} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, fiscalYearStartMonth: Number(event.target.value) })}>
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('fr', { month: 'long' }).format(new Date(2025, index, 1))}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Jour de début d’exercice</span>
              <input className={fieldClass} type="number" min={1} max={31} value={form.fiscalYearStartDay} disabled={!canManage || saveProfile.isPending} onChange={(event) => setForm({ ...form, fiscalYearStartDay: Number(event.target.value) })} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--divider)] pt-4">
            <p className="text-xs text-[var(--text-muted)]">Les taux de TVA et autres prélèvements ne sont pas présumés : ils devront être définis avec leurs dates d’effet et validés pour le pays.</p>
            {canManage && <button type="button" disabled={saveProfile.isPending || profile.isLoading || (form.industryCode === 'other' && !form.customIndustryName.trim())} onClick={() => companyId && saveProfile.mutate({ companyId, ...form, customIndustryName: form.customIndustryName.trim() || null })} className="inline-flex h-9 items-center gap-2 rounded bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Save size={14} /> {saveProfile.isPending ? 'Enregistrement…' : 'Enregistrer le profil'}
            </button>}
          </div>
          {accessRole.isError && <p role="alert" className="mt-2 text-xs text-red-600">Impossible de vérifier vos droits sur cette entreprise.</p>}
        </>
      )}

      <div className="mt-6 border-t border-[var(--divider)] pt-5">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Règles de taxe de l’entreprise</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Les taux sont saisis et datés par l’entreprise après validation locale. IDIBAGES n’applique aucun taux légal supposé. Les périodes actives d’un même type ne peuvent pas se chevaucher.</p>
        </div>
        {canManage && <form className="grid gap-3 rounded border border-[var(--glass-border)] bg-[var(--bg-card-hover)] p-3 sm:grid-cols-2 xl:grid-cols-6" onSubmit={(event) => {
          event.preventDefault();
          if (!companyId) return;
          createTaxRule.mutate({ companyId, ...taxForm, ratePercent: Number(taxForm.ratePercent), effectiveTo: taxForm.effectiveTo || null });
        }}>
          <label className="xl:col-span-1"><span className={labelClass}>Code</span><input required maxLength={40} pattern="[A-Za-z0-9_-]+" className={fieldClass} value={taxForm.code} onChange={(event) => setTaxForm({ ...taxForm, code: event.target.value })} placeholder="TVA_NORMAL" /></label>
          <label className="xl:col-span-1"><span className={labelClass}>Libellé</span><input required maxLength={120} className={fieldClass} value={taxForm.name} onChange={(event) => setTaxForm({ ...taxForm, name: event.target.value })} placeholder="TVA taux normal" /></label>
          <label><span className={labelClass}>Type</span><select className={fieldClass} value={taxForm.taxType} onChange={(event) => setTaxForm({ ...taxForm, taxType: event.target.value as TaxType })}><option value="vat">TVA</option><option value="withholding">Retenue à la source</option><option value="excise">Droit d’accise</option><option value="corporate_income">Impôt sur les bénéfices</option><option value="payroll_income">Impôt sur les salaires</option><option value="employee_social">Cotisation sociale salariale</option><option value="employer_social">Cotisation sociale patronale</option><option value="other">Autre</option></select></label>
          <label><span className={labelClass}>Taux (%)</span><input required type="number" min={0} max={100} step="0.0001" className={fieldClass} value={taxForm.ratePercent} onChange={(event) => setTaxForm({ ...taxForm, ratePercent: event.target.value })} placeholder="Saisir le taux validé" /></label>
          <label><span className={labelClass}>Applicable à partir du</span><input required type="date" className={fieldClass} value={taxForm.effectiveFrom} onChange={(event) => setTaxForm({ ...taxForm, effectiveFrom: event.target.value })} /></label>
          <div className="flex items-end"><button type="submit" disabled={createTaxRule.isPending || !taxForm.ratePercent} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} /> Ajouter la règle</button></div>
          <label className="sm:col-span-2 xl:col-span-2"><span className={labelClass}>Date de fin (facultative)</span><input type="date" min={taxForm.effectiveFrom} className={fieldClass} value={taxForm.effectiveTo} onChange={(event) => setTaxForm({ ...taxForm, effectiveTo: event.target.value })} /></label>
        </form>}
        <div className="mt-3 overflow-hidden rounded border border-[var(--glass-border)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-[var(--bg-card-hover)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"><span>Règle et période</span><span>Taux</span><span>État</span></div>
          {taxRules.data?.filter((rule) => rule.countryCode === form.countryCode).map((rule) => <div key={rule.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-[var(--divider)] px-3 py-2.5 text-xs">
            <span className="min-w-0"><strong className="block truncate text-[var(--text-primary)]">{rule.name} <span className="font-normal text-[var(--text-muted)]">({rule.code})</span></strong><span className="text-[var(--text-muted)]">{rule.taxType} · {rule.effectiveFrom}{rule.effectiveTo ? ` → ${rule.effectiveTo}` : ' · sans date de fin'}</span></span>
            <strong className="text-[var(--text-primary)]">{(rule.rateBasisPoints / 100).toLocaleString('fr-FR')} %</strong>
            {rule.isActive ? canManage ? <button type="button" disabled={archiveTaxRule.isPending} onClick={() => companyId && archiveTaxRule.mutate({ companyId, taxRuleId: rule.id })} className="rounded border border-[var(--glass-border)] px-2 py-1 text-[var(--text-secondary)] disabled:opacity-50">Désactiver</button> : <span className="text-emerald-700">Active</span> : <span className="text-[var(--text-muted)]">Désactivée</span>}
          </div>)}
          {!taxRules.isLoading && !(taxRules.data?.some((rule) => rule.countryCode === form.countryCode)) && <p className="border-t border-[var(--divider)] p-3 text-xs text-[var(--text-muted)]">Aucune règle définie pour {country.name}. Les documents ne doivent pas appliquer de taxe par défaut.</p>}
        </div>
      </div>
    </section>
  );
}
