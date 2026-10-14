import { ArrowRight, Check, Play } from "lucide-react";
import Image from "next/image";
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
            <p className="lp-eyebrow"><span /> {t("CONÃ‡U POUR LES ENTREPRISES DE LA ZONE OHADA")}</p>
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
              <Check size={14} /> {t("14 jours dâ€™essai")} <span>·</span> {t("Sans carte bancaire")}
            </p>
          </div>
          <div className="lp-hero-person">
            <Image
              src="/images/idibages-businessman.png"
              alt="Entrepreneur en costume tenant un ordinateur portable"
              width={1024}
              height={1536}
              sizes="(max-width: 650px) 100vw, (max-width: 1100px) 45vw, 550px"
              priority
              className="lp-businessman"
            />
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
