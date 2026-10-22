import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { trpc } from "@/providers/trpc";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySelectionStore } from "@/stores/companySelectionStore";
import { OHADA_COUNTRIES, OHADA_INDUSTRIES, type OhadaCountryCode, type OhadaIndustryCode } from "@/lib/ohada/countries";

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuth();
  const setActiveCompanyId = useCompanySelectionStore(
    state => state.setActiveCompanyId
  );
  const { data: plans = [] } = trpc.plan.list.useQuery();
  const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
  const createCompany = trpc.company.create.useMutation();
  const createSubscription = trpc.subscription.create.useMutation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    email: string;
    phone: string;
    city: string;
    countryCode: OhadaCountryCode;
    industryCode: OhadaIndustryCode;
    customIndustryName: string;
  }>({
    name: "",
    slug: "",
    email: user?.email ?? "",
    phone: "",
    city: "",
    countryCode: "CM",
    industryCode: "other",
    customIndustryName: "",
  });

  useEffect(() => {
    if (selectedPlanId !== "") return;
    const starter = plans.find(plan => plan.slug === "starter-monthly" && plan.billingCycle === "monthly");
    const defaultPlan = starter ?? plans.find(plan => plan.billingCycle === "monthly" && !plan.isEnterprise);
    if (defaultPlan) setSelectedPlanId(defaultPlan.id);
  }, [plans, selectedPlanId]);

  const updateName = (name: string) =>
    setForm(current => ({
      ...current,
      name,
      slug:
        current.slug ||
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
    }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const company = await createCompany.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        countryCode: form.countryCode,
        industryCode: form.industryCode,
        customIndustryName: form.industryCode === "other" ? form.customIndustryName.trim() : undefined,
      });
      setActiveCompanyId(company.id);

      const selectedPlan = plans.find(plan => plan.id === selectedPlanId && plan.billingCycle === "monthly");
      if (!selectedPlan) throw new Error("Choisissez un forfait mensuel disponible.");
      if (selectedPlan.trialDays && selectedPlan.trialDays > 0) {
        await createSubscription.mutateAsync({
          companyId: company.id,
          planId: selectedPlan.id,
          billingCycle: selectedPlan.billingCycle,
        });
      }

      showToast("Entreprise creee. Vous pouvez commencer.", "success");
      navigate("/dashboard");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Impossible de creer l'entreprise.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Créez votre espace entreprise."
      subtitle={`Bienvenue${user?.displayName ? ", " + user.displayName : ""}. Réunissez votre activité dans un espace dédié.`}
      wide
    >
      <form
        onSubmit={handleSubmit}
        className="id-auth-form"
        aria-busy={loading}
      >
        <AuthField
          id="company-name"
          name="companyName"
          label="Nom de l’entreprise"
          required
          minLength={2}
          autoComplete="organization"
          value={form.name}
          onChange={event => updateName(event.target.value)}
          disabled={loading}
        />
        <AuthField
          id="company-slug"
          name="companySlug"
          label="Identifiant de l’entreprise"
          required
          minLength={2}
          pattern="[a-z0-9-]+"
          value={form.slug}
          onChange={event =>
            setForm({ ...form, slug: event.target.value.toLowerCase() })
          }
          disabled={loading}
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="id-auth-help">
          Lettres minuscules, chiffres et tirets uniquement.
        </p>
        <div className="id-auth-field-row">
          <AuthField
            id="company-email"
            name="email"
            label="E-mail professionnel"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={event => setForm({ ...form, email: event.target.value })}
            disabled={loading}
          />
          <AuthField
            id="company-phone"
            name="phone"
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={event => setForm({ ...form, phone: event.target.value })}
            disabled={loading}
          />
        </div>
        <div className="id-auth-field-row">
          <AuthField
            id="company-city"
            name="city"
            label="Ville"
            autoComplete="address-level2"
            value={form.city}
            onChange={event => setForm({ ...form, city: event.target.value })}
            disabled={loading}
          />
          <div className="id-auth-select-field">
            <label htmlFor="company-country">Pays membre de l’OHADA</label>
            <select id="company-country" name="countryCode" value={form.countryCode} onChange={event => setForm({ ...form, countryCode: event.target.value as OhadaCountryCode })} disabled={loading}>
              {OHADA_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name} · {country.currency}</option>)}
            </select>
          </div>
        </div>
        <div className="id-auth-select-field">
          <label htmlFor="company-industry">Secteur d’activité</label>
          <select id="company-industry" value={form.industryCode} onChange={event => setForm({ ...form, industryCode: event.target.value as OhadaIndustryCode, customIndustryName: event.target.value === 'other' ? form.customIndustryName : '' })} disabled={loading}>
            {OHADA_INDUSTRIES.map(industry => <option key={industry.code} value={industry.code}>{industry.label}</option>)}
          </select>
        </div>
        {form.industryCode === 'other' && <AuthField id="company-custom-industry" name="customIndustryName" label="Précisez votre activité" required value={form.customIndustryName} onChange={event => setForm({ ...form, customIndustryName: event.target.value })} disabled={loading} />}
        <div className="id-auth-select-field">
          <label htmlFor="subscription-plan">Choisissez votre forfait de départ</label>
          <select id="subscription-plan" value={selectedPlanId} onChange={event => setSelectedPlanId(Number(event.target.value))} disabled={loading || plans.length === 0} required>
            {plans.filter(plan => plan.billingCycle === "monthly" && !plan.isEnterprise).map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name} — {plan.priceXAF.toLocaleString("fr-FR")} FCFA/mois {plan.trialDays ? "· essai de 14 jours" : ""}</option>
            ))}
          </select>
          <p className="id-auth-help">Aucun paiement n’est demandé pendant l’essai. Vous pourrez changer de forfait ensuite.</p>
        </div>
        <button type="submit" disabled={loading || selectedPlanId === ""} className="id-auth-submit">
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Création en cours…
            </>
          ) : (
            <>
              Créer mon espace <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
      <p className="id-auth-note">
        <LockKeyhole size={14} /> Un espace dédié à votre entreprise et à vos
        équipes.
      </p>
    </AuthShell>
  );
}
