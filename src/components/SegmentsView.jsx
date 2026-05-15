import { Icon, Pill, Mono, Dot, Bar } from "./atoms.jsx";

function Metric({ label, value, accent, bold }) {
  return (
    <div className={`metric ${accent ? "metric-accent" : ""} ${bold ? "metric-bold" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function SegmentCard({ seg, isSelected, onSelect, onOpenWhy }) {
  return (
    <article className={`seg-card ${isSelected ? "is-selected" : ""}`}>
      <header className="seg-head">
        <div className="seg-id">
          <Mono dim>{seg.id}</Mono>
          <Pill tone="warm" size="xs">{seg.profile}</Pill>
        </div>
        <h3 className="seg-name">{seg.name}</h3>
        <div className="seg-tags">
          {seg.usage.map((u, i) => <span key={i} className="seg-tag">{u}</span>)}
          <span className="seg-tag seg-tag-trend">{seg.trend}</span>
        </div>
      </header>

      <div className="seg-share">
        <div className="seg-share-row">
          <span>Eligible base</span>
          <span><Mono>{seg.users}</Mono> · {seg.sharePct}%</span>
        </div>
        <Bar value={seg.sharePct} tone="ink" />
        <div className="seg-share-row">
          <span>Share of impact</span>
          <span>{seg.impactPct}%</span>
        </div>
        <Bar value={seg.impactPct} tone="accent" />
      </div>

      <div className="seg-metrics">
        <Metric label="Current ARPU" value={seg.currentArpu} />
        <Metric label="Expected lift" value={seg.lift} accent />
        <Metric label="Target conv." value={seg.conv} />
        <Metric label="Revenue lift" value={seg.revLift} bold />
      </div>

      <div className="seg-block">
        <div className="seg-block-label">
          Recommended tactic
          <button className="why-btn" onClick={() => onOpenWhy(seg, "tactic")}>
            Why? <Icon name="arrow" size={10} />
          </button>
        </div>
        <div className="tactic">
          <div className="tactic-row">
            <span className="tactic-name">{seg.tactic.name}</span>
            <span className="tactic-cost"><Mono>{seg.tactic.cost}</Mono></span>
          </div>
          <div className="tactic-desc">{seg.tactic.desc}</div>
          <div className="tactic-rb">
            <Icon name="flow" size={11} />
            <span>{seg.rulebook}</span>
          </div>
        </div>
      </div>

      <div className="seg-block">
        <div className="seg-block-label">
          Channel mix
          <button className="why-btn" onClick={() => onOpenWhy(seg, "channel")}>
            Why? <Icon name="arrow" size={10} />
          </button>
        </div>
        <div className="channels">
          {seg.channels.map((c, i) => (
            <div key={i} className={`chan ${c.primary ? "chan-primary" : ""}`}>
              <div className="chan-l">
                {c.primary && <span className="chan-badge">primary</span>}
                <span className="chan-name">{c.ch}</span>
                <span className="chan-window">{c.window}</span>
              </div>
              <div className="chan-r">
                <Bar value={c.score * 100} tone={c.primary ? "accent" : "ink-soft"} />
                <span className="chan-score"><Mono>{c.score.toFixed(2)}</Mono></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="seg-foot">
        <div className="conf">
          <span className="conf-label">ML confidence</span>
          <Mono>{seg.modelConfidence.toFixed(2)}</Mono>
          <span className="conf-mock">mock</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onSelect(seg.id)}>
          Drilldown <Icon name="arrow" size={11} />
        </button>
      </footer>
    </article>
  );
}

export function SegmentsView({ segments, selectedId, onSelect, onOpenWhy }) {
  return (
    <div className="seg-grid" style={segments.length > 3 ? { gridTemplateColumns: "repeat(3, 1fr)" } : {}}>
      {segments.map((s) => (
        <SegmentCard
          key={s.id}
          seg={s}
          isSelected={s.id === selectedId}
          onSelect={onSelect}
          onOpenWhy={onOpenWhy}
        />
      ))}
    </div>
  );
}
