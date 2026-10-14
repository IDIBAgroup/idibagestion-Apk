import { BrandLogo } from "./BrandLogo";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AVAILABLE_LANGUAGES, useBrandingStore } from "@/stores/brandingStore";
import { applyPlatformLanguage } from "@/lib/language";
import { translate } from "@/lib/i18n";

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const language = useBrandingStore((state) => state.language);
  const t = (text: string) => translate(text, language);
  return (
    <header className="lp-header">
      <div className="lp-container lp-nav">
        <Link href="/" className="lp-brand" aria-label="IDIBAGES accueil">
          <BrandLogo showTag />
        </Link>
        <nav className="lp-desktop-nav" aria-label="Navigation principale">
          <Link href="#modules">{t("La plateforme")}</Link>
          <Link href="#syscohada">{t("Notre approche")}</Link>
          <Link href="#pricing">{t("Tarifs")}</Link>
        </nav>
        <div className="lp-nav-actions">
          <label className="sr-only" htmlFor="landing-language">Langue de la plateforme</label>
          <select id="landing-language" aria-label="Langue de la plateforme" value={language} onChange={(event) => applyPlatformLanguage(event.target.value as "fr" | "en" | "es")} className="lp-login bg-transparent">
            {AVAILABLE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.code.toUpperCase()}</option>)}
          </select>
          <Link href="/login" className="lp-login">{t("Connexion")}</Link>
          <Link href="/register" className="lp-button lp-button-small">
            {t("Essayer gratuitement")} <ArrowUpRight size={15} />
          </Link>
          <button
            className="lp-menu-button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="landing-mobile-nav"
          className="lp-mobile-nav"
          aria-label="Navigation mobile"
        >
          {[
            ["#modules", t("La plateforme")],
            ["#syscohada", t("Notre approche")],
            ["#pricing", t("Tarifs")],
            ["/login", t("Connexion")],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
