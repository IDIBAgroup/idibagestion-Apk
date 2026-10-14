import { Plus } from "lucide-react";
const questions = [
  [
    "Puis-je essayer la plateforme avant de choisir ?",
    "Oui. Vous disposez de 14 jours d’essai gratuit, sans carte bancaire, pour explorer les fonctionnalités et découvrir votre espace de travail.",
  ],
  [
    "La plateforme est-elle adaptée à la zone CEMAC ?",
    "IDIBAGES intègre le référentiel SYSCOHADA Révisé, des outils de préparation de la DSF OHADA, la gestion en Franc CFA et des fonctionnalités RH et paie CNPS.",
  ],
  [
    "Quels outils puis-je réunir dans IDIBAGES ?",
    "Selon votre forfait, vous pouvez réunir comptabilité, facturation, gestion commerciale, ressources humaines, projets et prospection VIBE AI. Consultez les fonctionnalités incluses dans chaque offre.",
  ],
  [
    "Mes clients et partenaires peuvent-ils accéder à leurs documents ?",
    "Des portails dédiés permettent aux clients, fournisseurs et partenaires de consulter les informations qui leur sont destinées. Leur disponibilité dépend du forfait choisi.",
  ],
  [
    "Comment choisir le bon forfait pour mon entreprise ?",
    "Comparez les fonctionnalités des offres ci-dessus. Pour un groupe, plusieurs filiales ou des besoins d’intégration spécifiques, contactez notre équipe pour discuter de l’offre Enterprise.",
  ],
];
export function FaqSection() {
  return (
    <section id="faq" className="lp-section lp-container lp-faq">
      <div>
        <p className="lp-eyebrow">ON VOUS RÉPOND</p>
        <h2>
          Quelques questions
          <br />
          avant de commencer ?
        </h2>
        <p>Notre équipe est aussi là pour vous accompagner.</p>
        <a className="lp-text-link" href="mailto:support@idibages.com">
          support@idibages.com
        </a>
      </div>
      <div className="lp-faq-list">
        {questions.map(([question, answer], index) => (
          <details key={question}>
            <summary>
              <span className="lp-faq-number">0{index + 1}</span>
              <span className="lp-faq-question">{question}</span>
              <Plus size={19} />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
