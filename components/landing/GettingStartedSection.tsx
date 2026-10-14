export function GettingStartedSection() {
  return (
    <section className="lp-section lp-container lp-getting-started">
      <div className="lp-section-heading">
        <div>
          <p className="lp-eyebrow">VOS PREMIERS PAS</p>
          <h2>
            Une nouvelle façon de travailler.
            <br />
            Un départ simple.
          </h2>
        </div>
        <p>
          Commencez par vos priorités, puis réunissez progressivement toute
          votre activité.
        </p>
      </div>
      <div className="lp-steps">
        {[
          [
            "01",
            "Créez votre espace",
            "Inscrivez votre entreprise et découvrez la plateforme pendant 14 jours.",
          ],
          [
            "02",
            "Réunissez vos données",
            "Ajoutez vos clients, vos collaborateurs et les informations de votre entreprise.",
          ],
          [
            "03",
            "Pilotez votre activité",
            "Émettez vos factures, organisez vos projets et partagez une vue claire avec votre équipe.",
          ],
        ].map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
