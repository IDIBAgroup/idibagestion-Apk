import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { modules } from "./moduleData";
import { ModuleCard } from "./ModuleCard";

export function ModulesSection() {
  return (
    <section id="modules" className="lp-section lp-container">
      <div className="lp-section-heading">
        <div>
          <p className="lp-eyebrow">LA PLATEFORME</p>
          <h2>
            Tout ce qui compte.
            <br />
            Au même endroit.
          </h2>
        </div>
        <p>
          De vos premières factures à vos prochains projets, chaque métier
          trouve sa place dans une plateforme commune.
        </p>
      </div>
      <div className="lp-capabilities-grid">
        {modules.map((item, index) => (
          <ModuleCard
            key={item.id}
            item={item}
            featured={index === 0}
            number={index + 1}
          />
        ))}
      </div>
      <div className="lp-capabilities-footer">
        <p>Cinq métiers. Une seule vision de votre entreprise.</p>
        <Link href="/register" className="lp-text-link">
          Découvrir avec mon équipe <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
