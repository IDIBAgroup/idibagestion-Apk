import { Check } from "lucide-react";
import type { ModuleInfo } from "./moduleData";

export function ModuleCard({
  item,
  featured = false,
  number,
}: {
  item: ModuleInfo;
  featured?: boolean;
  number: number;
}) {
  const Icon = item.icon;
  return (
    <article
      className={`lp-capability ${featured ? "lp-capability-featured" : ""}`}
      aria-labelledby={`module-${item.id}`}
    >
      <div className="lp-capability-copy">
        <div className="lp-capability-label">
          <span>
            <Icon size={19} />
            {item.label}
          </span>
          <small>0{number}</small>
        </div>
        <h3 id={`module-${item.id}`}>{item.title}</h3>
        <p>{item.description}</p>
        <ul>
          {item.features.map(feature => (
            <li key={feature}>
              <Check size={14} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="lp-capability-preview">
        <div className="lp-capability-preview-title">
          <span>{item.caption}</span>
          <small>EXEMPLE</small>
        </div>
        <strong className="lp-capability-metric">{item.metric}</strong>
        <p>{item.unit}</p>
        {item.id === "finance" && (
          <div className="lp-capability-bars" aria-hidden="true">
            {[32, 48, 41, 62, 57, 82, 72, 100].map((height, i) => (
              <span key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
        )}
        {item.id === "projects" && (
          <div
            className="lp-capability-progress"
            role="img"
            aria-label="Projet terminé à 78 %"
          >
            <span />
          </div>
        )}
        {featured && (
          <dl>
            {item.rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
