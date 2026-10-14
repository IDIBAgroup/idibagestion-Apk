import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import "./auth.css";

export function AuthShell({
  children,
  title,
  subtitle,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  wide?: boolean;
}) {
  return (
    <main className="id-auth">
      <div className="id-auth-grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <Link href="/" className="id-auth-back">
        <ArrowLeft size={15} /> Retour à l’accueil
      </Link>
      <div className={`id-auth-frame ${wide ? "id-auth-wide" : ""}`}>
        <section className="id-auth-card" aria-labelledby="auth-title">
          <header className="id-auth-brand">
            <Link href="/" aria-label="IDIBAGES accueil">
              <BrandLogo />
            </Link>
            <LockKeyhole size={35} aria-hidden="true" />
          </header>
          <div className="id-auth-heading">
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          <footer className="id-auth-footer">
            <span>© {new Date().getFullYear()} IDIBAGES</span>
            <span>Votre espace professionnel</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
