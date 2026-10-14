import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";

export function DashboardPreview() {
  return (
    <div
      className="lp-dashboard"
      aria-label="Aperçu illustratif du tableau de bord IDIBAGES"
    >
      <div className="lp-dashboard-top">
        <span className="lp-dashboard-logo">ID.</span>
        <span>Espace entreprise</span>
        <span className="lp-preview-label">Aperçu</span>
      </div>
      <div className="lp-dashboard-body">
        <aside className="lp-dashboard-sidebar" aria-hidden="true">
          {[LayoutDashboard, FileText, Users, Briefcase, BarChart3].map(
            (Icon, i) => (
              <span key={i} className={i === 0 ? "is-active" : ""}>
                <Icon size={18} />
              </span>
            )
          )}
        </aside>
        <div className="lp-dashboard-content">
          <div className="lp-dashboard-heading">
            <div>
              <span className="lp-small-label">VUE D’ENSEMBLE</span>
              <h3>Bonjour, votre activité avance.</h3>
            </div>
            <span className="lp-avatar">AD</span>
          </div>
          <div className="lp-dashboard-kpis">
            <div>
              <span>Chiffre d’affaires</span>
              <strong>
                48,75 M <small>FCFA</small>
              </strong>
              <em>
                <ArrowUpRight size={12} /> 18,4 % ce mois-ci
              </em>
            </div>
            <div>
              <span>Factures réglées</span>
              <strong>
                86 <small>/ 100</small>
              </strong>
              <em>Une trésorerie sous contrôle</em>
            </div>
          </div>
          <div className="lp-chart">
            <div className="lp-chart-heading">
              <strong>Performance de votre activité</strong>
              <span>6 derniers mois</span>
            </div>
            <div className="lp-bars">
              {[38, 52, 45, 68, 60, 88].map((height, i) => (
                <div key={i}>
                  <span style={{ height: `${height}%` }} />
                  <small>
                    {["Avr", "Mai", "Juin", "Juil", "Août", "Sept"][i]}
                  </small>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-dashboard-list">
            <strong>Dernières opérations</strong>
            {[
              ["FAC-089", "Groupe SOCAPALM", "1 250 000"],
              ["FAC-088", "Bâtir Cameroun", "845 000"],
            ].map(([id, client, amount]) => (
              <div key={id}>
                <span className="lp-invoice-icon">
                  <FileText size={15} />
                </span>
                <span>
                  <b>{client}</b>
                  <small>{id}</small>
                </span>
                <span className="lp-invoice-amount">
                  {amount} <small>FCFA</small>
                </span>
                <span className="lp-paid">Réglée</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lp-dashboard-note">
        <span className="lp-status-dot" /> Comptabilité, équipes et projets.
        Enfin connectés.
      </div>
    </div>
  );
}
