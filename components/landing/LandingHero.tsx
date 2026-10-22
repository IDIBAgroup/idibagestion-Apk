import { ArrowRight, Check, Play } from "lucide-react";
import { useBrandingStore } from "@/stores/brandingStore";
import { translate } from "@/lib/i18n";

export function LandingHero() {
  const language = useBrandingStore((state) => state.language);
  const t = (text: string) => translate(text, language);
  return (
    <>
      <section className="lp-hero-band lp-hero-unified">
        <div className="lp-container lp-hero lp-hero-portrait">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow"><span /> {t("CONÇU POUR LES ENTREPRISES DE LA ZONE OHADA")}</p>
            <h1>
              {t("Moins de gestion.")}
              <br />
              Plus de <span>{t("perspectives.")}</span>
            </h1>
            <p className="lp-hero-description">{t("Comptabilité, équipes et projets : un seul espace pour piloter votre entreprise en Afrique.")}</p>
            <div className="lp-hero-actions">
              <a href="/register" className="lp-button">
                {t("Commencer gratuitement")} <ArrowRight size={17} />
              </a>
              <a href="#modules" className="lp-text-link">
                <Play size={15} /> {t("Explorer la plateforme")}
              </a>
            </div>
            <p className="lp-trial-note">
              <Check size={14} /> {t("14 jours d’essai")} <span>·</span> {t("Sans carte bancaire")}
            </p>
          </div>
          <div className="lp-hero-person lp-hero-devices" role="img" aria-label={t("Aperçu du tableau de bord IDIBAGES sur ordinateur et téléphone")}>
            <div className="lp-laptop-mockup" aria-hidden="true">
              <div className="lp-laptop-screen">
                <div className="lp-dashboard-sidebar">
                  <span className="lp-dashboard-brand"><b>I</b><strong>IDIBAGES</strong></span>
                  <span className="is-active"><i />{t("Tableau de bord")}</span>
                  <span><i />{t("Comptabilité")}</span>
                  <span><i />{t("Facturation")}</span>
                  <span><i />{t("Ressources humaines")}</span>
                  <span><i />{t("Paramètres")}</span>
                  <span className="lp-dashboard-user"><b>HN</b> Hervé N.</span>
                </div>
                <div className="lp-dashboard-main">
                  <div className="lp-dashboard-topbar"><span>{t("Espace entreprise")}</span><span className="lp-dashboard-avatar">HN</span></div>
                  <div className="lp-dashboard-heading"><div><small>{t("MARDI 14 OCTOBRE 2026")}</small><h3>{t("Bonjour, Hervé")}</h3><p>{t("Voici le résumé de votre activité")}</p></div><button>{t("Cette année")}⌄</button></div>
                  <div className="lp-dashboard-metrics">
                    <article><small>{t("Chiffre d'affaires")}</small><strong>24,8 M <em>+12,8%</em></strong><span>{t("vs période précédente")}</span></article>
                    <article><small>{t("Trésorerie")}</small><strong>8,4 M <em>+4,2%</em></strong><span>{t("solde disponible")}</span></article>
                    <article><small>{t("Factures en attente")}</small><strong>12 <b>FCFA</b></strong><span>{t("à suivre cette semaine")}</span></article>
                  </div>
                  <div className="lp-dashboard-lower">
                    <article className="lp-dashboard-chart"><div><strong>{t("Évolution des revenus")}</strong><small>{t("Janvier — Décembre")}</small></div><div className="lp-chart-plot"><span /><span /><span /><span /><span /><span /><span /><svg viewBox="0 0 460 100" preserveAspectRatio="none"><path d="M0 78 C35 66 45 70 75 54 S120 68 150 47 S195 55 225 39 S270 49 300 26 S345 43 375 24 S425 32 460 8" /></svg></div></article>
                    <article className="lp-dashboard-activity"><strong>{t("Activité récente")}</strong><p><b>✓</b><span>{t("Facture payée")}<small>FAC-2026-1042 · 2 min</small></span><em>+350 000</em></p><p><b>↗</b><span>{t("Nouveau client")}<small>Entreprise ABC · 1 h</small></span></p><p><b>▤</b><span>{t("Dépense enregistrée")}<small>Fournitures · 3 h</small></span></p></article>
                  </div>
                </div>
              </div>
              <div className="lp-laptop-base" />
            </div>
            <div className="lp-phone-mockup">
              <div className="lp-phone-camera" />
              <div className="lp-phone-content">
                <div className="lp-phone-top"><b>I</b><span>IDIBAGES</span><i>•••</i></div>
                <small>{t("BONJOUR, HERVÉ")}</small><h4>{t("Votre activité")}</h4>
                <article className="lp-phone-revenue"><span>{t("Chiffre d'affaires")}</span><strong>24,8 M <em>+12,8%</em></strong><div><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
                <div className="lp-phone-section"><strong>{t("Activité récente")}</strong><a>{t("Tout voir")}</a></div>
                <article className="lp-phone-item"><b>✓</b><span>{t("Facture payée")}<small>FAC-2026-1042</small></span><em>+350k</em></article>
                <article className="lp-phone-item"><b>↗</b><span>{t("Nouveau client")}<small>Entreprise ABC</small></span></article>
                <article className="lp-phone-item"><b>▤</b><span>{t("Dépense enregistrée")}<small>Fournitures</small></span></article>
                <div className="lp-phone-nav"><i>⌂</i><i>▦</i><i>＋</i><i>◷</i><i>☻</i></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="lp-container lp-foundation">
        <p>
          Votre quotidien, simplifié.
          <br />
          <strong>Vos exigences locales, intégrées.</strong>
        </p>
        <span>SYSCOHADA Révisé</span>
        <span>DSF OHADA</span>
        <span>Paie & CNPS</span>
        <span>Franc CFA · XAF</span>
      </div>
    </>
  );
}
