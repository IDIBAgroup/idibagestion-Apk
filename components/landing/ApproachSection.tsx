import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";

export function ApproachSection() {
  return (
    <section id="syscohada" className="lp-local-stories">
      <div className="lp-container">
        <div className="lp-section-heading">
          <div>
            <p className="lp-eyebrow">ANCRÉ DANS VOTRE RÉALITÉ</p>
            <h2>
              Vos métiers. Vos équipes.
              <br />
              Votre façon d’avancer.
            </h2>
          </div>
          <p>
            Des outils adaptés aux entreprises d’Afrique Centrale, pour
            travailler ensemble avec une vision plus claire.
          </p>
        </div>
        <article className="lp-story-row">
          <div className="lp-story-image">
            <Image
              src="/images/idibages-finance-team.png"
              alt="Professionnelle de la finance examinant des documents comptables à son bureau"
              width={1536}
              height={1024}
              sizes="(max-width: 650px) 100vw, 50vw"
            />
            <span>01 / UNE GESTION FINANCIÈRE PLUS CLAIRE</span>
          </div>
          <div className="lp-story-copy">
            <p className="lp-eyebrow">COMPTABILITÉ & CONFORMITÉ</p>
            <h3>
              Concentrez-vous sur les décisions.
              <br />
              Gardez le cap sur vos obligations.
            </h3>
            <p>
              Retrouvez vos informations financières dans un espace cohérent,
              avec les référentiels et les outils nécessaires à votre gestion
              locale.
            </p>
            <ul>
              <li>
                <Check size={16} />
                Plan comptable SYSCOHADA Révisé
              </li>
              <li>
                <Check size={16} />
                Préparation des états financiers et de la DSF
              </li>
              <li>
                <Check size={16} />
                Gestion en Franc CFA, sans conversion inutile
              </li>
            </ul>
            <Link href="/register" className="lp-text-link">
              Découvrir la gestion financière <ArrowRight size={16} />
            </Link>
          </div>
        </article>
        <article className="lp-story-row lp-story-reverse">
          <div className="lp-story-image">
            <Image
              src="/images/idibages-collaboration.png"
              alt="Trois collègues échangeant autour d’un ordinateur dans un bureau"
              width={1536}
              height={1024}
              sizes="(max-width: 650px) 100vw, 50vw"
            />
            <span>02 / UNE ÉQUIPE SUR LA MÊME LONGUEUR D’ONDE</span>
          </div>
          <div className="lp-story-copy">
            <p className="lp-eyebrow">ÉQUIPES & COLLABORATION</p>
            <h3>
              Votre activité avance mieux
              <br />
              quand tout le monde est connecté.
            </h3>
            <p>
              Réunissez les équipes, la paie et les projets dans une plateforme
              pensée pour votre quotidien. Chacun retrouve les informations
              utiles à son travail.
            </p>
            <ul>
              <li>
                <Check size={16} />
                Dossiers collaborateurs et suivi RH
              </li>
              <li>
                <Check size={16} />
                Paie et cotisations CNPS
              </li>
              <li>
                <Check size={16} />
                Projets et informations partagés
              </li>
            </ul>
            <Link href="/register" className="lp-text-link">
              Construire une gestion plus sereine <ArrowRight size={16} />
            </Link>
          </div>
        </article>
        <div className="lp-access-panel">
          <div className="lp-access-intro">
            <LockKeyhole size={25} />
            <div>
              <h3>Chaque accès à sa juste place.</h3>
              <p>Partagez ce qui compte, avec les bonnes personnes.</p>
            </div>
          </div>
          <ul>
            <li>Rôles et autorisations pour vos équipes</li>
            <li>Portails clients, fournisseurs et partenaires</li>
            <li>Informations adaptées à chaque utilisateur</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
