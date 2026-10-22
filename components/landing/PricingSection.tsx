import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { defaultPlans, type LandingPlan } from "./plans";

function planFeatures(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function PlanDialog({
  plan,
  yearly,
  onClose,
}: {
  plan: LandingPlan;
  yearly: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="lp-plan-dialog"
      onCancel={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="plan-dialog-title"
    >
      <div className="lp-dialog-inner">
        <button
          className="lp-dialog-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <p className="lp-eyebrow">VOTRE PROCHAIN CHAPITRE</p>
        <h2 id="plan-dialog-title">{plan.name}</h2>
        <p>Découvrez votre nouvel espace de travail pendant 14 jours.</p>
        <dl>
          <div>
            <dt>Abonnement</dt>
            <dd>{yearly ? "Annuel" : "Mensuel"}</dd>
          </div>
          <div>
            <dt>Après votre essai</dt>
            <dd>
              {plan.enterprise ? "Sur devis" : `${plan.price.toLocaleString("fr-FR")} FCFA / ${plan.billing}`}
            </dd>
          </div>
        </dl>
        <a href="/register" className="lp-button">
          Créer mon compte <ArrowRight size={16} />
        </a>
        <button className="lp-dialog-cancel" onClick={onClose}>
          Revenir aux forfaits
        </button>
      </div>
    </dialog>
  );
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [selected, setSelected] = useState<LandingPlan | null>(null);
  const { data, isLoading, isError } = trpc.plan.list.useQuery();
  const fetched: LandingPlan[] = (data ?? [])
    .filter(plan => plan.billingCycle === (yearly ? "yearly" : "monthly"))
    .map(plan => ({
      id: String(plan.id),
      slug: plan.slug,
      name: plan.name,
      description: plan.description || "",
      price: plan.priceXAF,
      originalPrice: plan.originalPriceXAF ?? undefined,
      billing: yearly ? "an" : "mois",
      features: planFeatures(plan.features),
      cta: plan.isEnterprise
        ? "Parlons de votre entreprise"
        : "Essayer gratuitement",
      popular: Boolean(plan.isPopular),
      enterprise: Boolean(plan.isEnterprise),
    }));
  const plans = fetched.length ? fetched : defaultPlans(yearly);
  return (
    <section id="pricing" className="lp-section lp-container">
      <div className="lp-pricing-heading">
        <p className="lp-eyebrow">UNE OFFRE POUR CHAQUE ÉTAPE</p>
        <h2>
          De la première facture
          <br />à vos prochaines ambitions.
        </h2>
        <p>Choisissez le forfait qui accompagne votre entreprise.</p>
        <div
          className="lp-billing"
          role="group"
          aria-label="Période de facturation"
        >
          <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Mensuel
          </button>
          <button aria-pressed={yearly} onClick={() => setYearly(true)}>
            Annuel
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">2 mois offerts</span>
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="lp-pricing-loading" role="status">
          <Loader2 className="animate-spin" /> Chargement des forfaits…
        </div>
      ) : (
        <>
          {isError && (
            <p className="lp-pricing-notice" role="status">
              Tarifs indicatifs affichés. Les conditions seront confirmées lors
              de votre inscription.
            </p>
          )}
          <div className="lp-pricing-grid">
            {plans.map(plan => (
              <article
                key={plan.id}
                className={`lp-price-card ${plan.popular ? "is-popular" : ""}`}
              >
                <div className="lp-price-top">
                  <span>
                    {plan.popular
                      ? "LE CHOIX DES PME"
                      : plan.enterprise
                        ? "UNE SOLUTION À VOTRE ÉCHELLE"
                        : "POUR BIEN DÉMARRER"}
                  </span>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
                <div className="lp-price">
                  <strong>{plan.enterprise ? "Sur devis" : plan.price.toLocaleString("fr-FR")}</strong>
                  {!plan.enterprise && <span>FCFA / {plan.billing}</span>}
                </div>
                {plan.enterprise ? (
                  <a
                    className="lp-button lp-button-outline"
                    href="mailto:support@idibages.com?subject=Demande%20offre%20Enterprise"
                  >
                    Parlons de votre entreprise <ArrowRight size={16} />
                  </a>
                ) : (
                  <button
                    className={`lp-button ${plan.popular ? "" : "lp-button-outline"}`}
                    onClick={() => setSelected(plan)}
                  >
                    Essayer gratuitement <ArrowRight size={16} />
                  </button>
                )}
                <ul>
                  {plan.features.map((feature, i) => (
                    <li key={`${feature}-${i}`}>
                      <Check size={15} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="lp-pricing-footnote">
            14 jours pour découvrir la plateforme. Sans carte bancaire. L’annuel est payable en une fois et revient à 10 mois.
          </p>
        </>
      )}
      {selected && (
        <PlanDialog
          plan={selected}
          yearly={yearly}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
