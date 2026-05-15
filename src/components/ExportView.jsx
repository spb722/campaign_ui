import { Icon, Mono } from "./atoms.jsx";

export function ExportView({ campaignData }) {
  if (!campaignData) {
    return (
      <div style={{ color: "var(--ink-3)", padding: "24px 0" }}>
        Generate a campaign plan first to export a one-pager.
      </div>
    );
  }

  const { campaignId, campaignTitle, kpis, segments, contentDrafts } = campaignData;
  const impactKpi = kpis.find((k) => k.tone === "hero");
  const costKpi = kpis.find((k) => k.label.toLowerCase().includes("cost"));
  const usersKpi = kpis.find((k) => k.label.toLowerCase().includes("base"));

  const includes = ["Objective", "KPI strip", `${segments.length} Segments`, "Channel plan", `${contentDrafts.length} Content drafts`, "Validation"];

  const handleCopyJson = () => {
    const json = JSON.stringify({
      campaign_id: campaignId,
      campaign_title: campaignTitle,
      segments: segments.map((s) => ({
        id: s.id,
        name: s.name,
        users: s.customerCount,
        projected_impact: s.projectedImpact,
        channels: s.channels,
        tactic: s.tactic.name,
      })),
      projection: {
        total_impact: campaignData.totalImpact,
        total_users: campaignData.totalUsers,
      },
    }, null, 2);
    navigator.clipboard?.writeText(json);
  };

  return (
    <div className="export">
      <div className="export-card">
        <div className="export-l">
          <div className="export-eyebrow">One-pager</div>
          <div className="export-title">{campaignId} · {campaignTitle}</div>
          <div className="export-meta">
            <span>{segments.length} segments</span>
            <span className="crumb-sep">·</span>
            <span>PDF · A4</span>
            <span className="crumb-sep">·</span>
            <span>v{campaignData.version || 1}</span>
          </div>
          <div className="export-includes">
            {includes.map((c) => (
              <span key={c} className="export-chip">{c}</span>
            ))}
          </div>
        </div>
        <div className="export-r">
          <div className="paper">
            <div className="paper-h">
              <div className="paper-title">{campaignTitle}</div>
              <div className="paper-meta"><Mono>{campaignId}</Mono></div>
            </div>
            <div className="paper-kpis">
              <div><span>Impact</span><strong>{impactKpi?.value || "—"}</strong></div>
              <div><span>Cost</span><strong>{costKpi?.value || "—"}</strong></div>
              <div><span>Users</span><strong>{usersKpi?.value || "—"}</strong></div>
            </div>
            <div className="paper-lines">
              <div /><div /><div /><div className="short" />
            </div>
          </div>
        </div>
      </div>
      <div className="export-actions">
        <button className="btn btn-ghost" onClick={handleCopyJson}>
          <Icon name="copy" size={12} />Copy JSON
        </button>
        <div style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
          PDF export requires a future <Mono>/campaign/export</Mono> endpoint.
        </div>
      </div>
    </div>
  );
}
