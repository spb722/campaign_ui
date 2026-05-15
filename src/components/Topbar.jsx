import { Icon, Pill, Mono } from "./atoms.jsx";

export function Topbar({ campaignId, campaignTitle }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">c</span>
        <span>campaign</span>
        <Pill tone="neutral" size="xs">mvp</Pill>
      </div>
      <div className="crumbs">
        <span>Workspace</span>
        <span className="crumb-sep">/</span>
        <strong>{campaignId ? `${campaignId} · ARPU lift` : "New campaign"}</strong>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-meta">
        <span><Mono>gpt-4.1-mini</Mono> · Oman Telecom</span>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost btn-sm">
          <Icon name="download" size={11} />Export
        </button>
      </div>
    </header>
  );
}
