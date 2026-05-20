import { useState } from "react";
import { Icon, Pill, Mono, SectionLabel, Spinner } from "./atoms.jsx";
import { regenerateContent } from "../api.js";

export function ContentView({ drafts, campaignId, onRegenerated }) {
  const [selected, setSelected] = useState(0);
  const [showInstruction, setShowInstruction] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);

  const draft = drafts[selected] || drafts[0];

  if (!draft) return <div style={{ color: "var(--ink-3)" }}>No content drafts available.</div>;

  const channelClass = draft.channel.toLowerCase().replace(/\s/g, "");

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenError(null);
    try {
      const payload = {
        regenerate_scope: "content_only",
        segment_id: draft.segmentId,
        channel: draft.channel.toLowerCase(),
      };
      if (instruction.trim()) payload.user_instruction = instruction.trim();
      const response = await regenerateContent(campaignId, payload);
      onRegenerated(response.data);
      setShowInstruction(false);
      setInstruction("");
    } catch (err) {
      setRegenError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

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
              <button
                className={`btn btn-ghost btn-sm${showInstruction ? " is-active" : ""}`}
                onClick={() => { setShowInstruction((v) => !v); setRegenError(null); }}
              >
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

        {showInstruction && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0 12px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea
                autoFocus
                rows={1}
                placeholder='Optional: "Make it shorter and more premium."'
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRegenerate();
                }}
                disabled={regenerating}
                style={{
                  flex: 1,
                  resize: "vertical",
                  minHeight: 32,
                  padding: "6px 8px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  color: "var(--ink-1)",
                  outline: "none",
                }}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Regenerate (⌘Enter)"
              >
                {regenerating ? <Spinner small /> : <Icon name="refresh" size={11} />}
              </button>
            </div>
            {regenError && (
              <div style={{ fontSize: 11, color: "var(--err, #c73d2a)" }}>{regenError}</div>
            )}
            <button
              style={{ fontSize: 11, color: "var(--ink-3)", background: "none", border: "none", padding: 0, cursor: "pointer", alignSelf: "flex-start" }}
              onClick={() => { setShowInstruction(false); setInstruction(""); setRegenError(null); }}
            >
              Cancel
            </button>
          </div>
        )}

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
