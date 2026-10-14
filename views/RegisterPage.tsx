import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { trpc } from "@/providers/trpc";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySelectionStore } from "@/stores/companySelectionStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuth();
  const setActiveCompanyId = useCompanySelectionStore(
    state => state.setActiveCompanyId
  );
  const { data: plans = [] } = trpc.plan.list.useQuery();
  const createCompany = trpc.company.create.useMutation();
  const createSubscription = trpc.subscription.create.useMutation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: user?.email ?? "",
    phone: "",
    city: "",
    country: "Cameroun",
  });

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
        country: form.country,
      });
      setActiveCompanyId(company.id);

      const starterPlan = plans.find(
        plan =>
          plan.slug === "starter-monthly" && plan.billingCycle === "monthly"
      );
      if (starterPlan?.trialDays && starterPlan.trialDays > 0) {
        await createSubscription.mutateAsync({
          companyId: company.id,
          planId: starterPlan.id,
          billingCycle: starterPlan.billingCycle,
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
          <AuthField
            id="company-country"
            name="country"
            label="Pays"
            autoComplete="country-name"
            value={form.country}
            onChange={event =>
              setForm({ ...form, country: event.target.value })
            }
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="id-auth-submit">
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
