import { BrandLogo } from "./BrandLogo";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
export function LandingFooter() {
  return (
    <>
      <section className="lp-container lp-final-cta">
        <div>
          <p className="lp-eyebrow">LA SUITE COMMENCE ICI</p>
          <h2>
            Faites de la place
            <br />à votre croissance.
          </h2>
          <p>
            Votre prochain outil de gestion. Votre nouvelle façon d’avancer.
          </p>
        </div>
        <div>
          <Link href="/register" className="lp-button">
            Essayer IDIBAGES <ArrowRight size={18} />
          </Link>
          <span>14 jours gratuits · Sans carte bancaire</span>
        </div>
      </section>
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <Link href="/" className="lp-brand">
                <BrandLogo />
              </Link>
              <p>
                La gestion d’entreprise,
                <br />
                pensée pour l’Afrique Centrale.
              </p>
              <span>
                IDIBA GROUP SARL
                <br />
                Douala & Yaoundé, Cameroun
              </span>
            </div>
            <nav aria-label="Plateforme">
              <h3>La plateforme</h3>
              <Link href="#modules">Les modules</Link>
              <Link href="#syscohada">Notre approche</Link>
              <Link href="#pricing">Les forfaits</Link>
              <Link href="#faq">Questions fréquentes</Link>
            </nav>
            <nav aria-label="Accès aux portails">
              <h3>Votre espace</h3>
              <Link href="/login">Connexion</Link>
              <Link href="/portal/client">Portail client</Link>
              <Link href="/portal/vendor">Portail fournisseur</Link>
              <Link href="/portal/partner">Portail partenaire</Link>
            </nav>
            <div>
              <h3>Parlons de vos projets</h3>
              <p>
                Une question, un besoin particulier ?<br />
                Échangeons sur votre entreprise.
              </p>
              <Link href="mailto:support@idibages.com">
                support@idibages.com <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} IDIBA GROUP SARL</span>
            <span>Conçu pour avancer ensemble.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
