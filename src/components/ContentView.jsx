import { useState } from "react";
import { Icon, Pill, Mono, SectionLabel } from "./atoms.jsx";

export function ContentView({ drafts }) {
  const [selected, setSelected] = useState(0);
  const draft = drafts[selected] || drafts[0];

  if (!draft) return <div style={{ color: "var(--ink-3)" }}>No content drafts available.</div>;

  const channelClass = draft.channel.toLowerCase().replace(/\s/g, "");

  return (
    <div className="content">
      <div className="content-l">
        <SectionLabel count={drafts.length}>Drafts</SectionLabel>
        <div className="content-list">
          {drafts.map((d, i) => (
            <button
              key={i}
              className={`content-item ${i === selected ? "is-selected" : ""}`}
              onClick={() => setSelected(i)}
            >
              <div className="content-item-l">
                <Mono dim>{d.segmentId}</Mono>
                <span className="content-channel">{d.channel}</span>
              </div>
              <div className="content-item-title">{d.title}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="content-r">
        <SectionLabel
          action={
            <div className="content-actions">
              <button className="btn btn-ghost btn-sm">
                <Icon name="refresh" size={11} />Regenerate
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard?.writeText(draft.body)}
              >
                <Icon name="copy" size={11} />Copy
              </button>
            </div>
          }
        >
          Preview
        </SectionLabel>

        <div className="preview">
          <div className="preview-meta">
            <div className="preview-meta-row">
              <span>Segment</span>
              <span>{draft.segmentName} <Mono dim>· {draft.segmentId}</Mono></span>
            </div>
            <div className="preview-meta-row">
              <span>Channel</span>
              <span>{draft.channel}</span>
            </div>
            <div className="preview-meta-row">
              <span>Tone</span>
              <span style={{ textTransform: "capitalize" }}>{draft.tone}</span>
            </div>
            <div className="preview-meta-row">
              <span>Approval</span>
              <span>
                {draft.approvalRequired
                  ? <Pill tone="warn" size="xs">approval required</Pill>
                  : <Pill tone="ok" size="xs">approved</Pill>}
              </span>
            </div>
          </div>

          <div className={`device device-${channelClass}`}>
            <div className="device-header">
              <span></span>
              <Mono dim>Now</Mono>
            </div>
            <div className="bubble">
              <div className="bubble-title">{draft.title}</div>
              <div className="bubble-body">{draft.body}</div>
            </div>
            <div className="bubble-actions">
              <span className="bubble-cta">Activate ›</span>
              <span className="bubble-dismiss">Dismiss</span>
            </div>
          </div>

          {draft.whyCopy && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5, borderTop: "1px solid var(--line-2)", paddingTop: 12 }}>
              <strong style={{ color: "var(--ink-2)" }}>Why this copy:</strong> {draft.whyCopy}
            </div>
          )}

          {draft.complianceNotes?.length > 0 && (
            <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
              {draft.complianceNotes.map((n, i) => <div key={i}>· {n}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
