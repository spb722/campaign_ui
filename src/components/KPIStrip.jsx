import { Pill } from "./atoms.jsx";

export function KPIStrip({ kpis }) {
  return (
    <div className="kpis">
      {kpis.map((k, i) => (
        <div key={i} className={`kpi ${k.tone === "hero" ? "kpi-hero" : ""}`}>
          <div className="kpi-label">
            {k.label}
            {k.tone === "hero" && <Pill tone="accent" size="xs">target</Pill>}
          </div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
