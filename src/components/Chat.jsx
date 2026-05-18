import { useState, useEffect, useRef } from "react";
import { Icon, Pill, Mono, Dot, KBD, Spinner } from "./atoms.jsx";

// ── Lightweight inline markdown renderer ──────────────────────────────────────
function renderInline(text) {
  const out = [];
  let remaining = text;
  let key = 0;
  while (remaining.length) {
    const m = remaining.match(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
    if (!m) { out.push(<span key={key++}>{remaining}</span>); break; }
    if (m.index > 0) out.push(<span key={key++}>{remaining.slice(0, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key++} className="md-code">{tok.slice(1, -1)}</code>);
    else out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    remaining = remaining.slice(m.index + tok.length);
  }
  return out;
}

function MD({ children }) {
  const lines = (children || "").split("\n");
  return (
    <div className="md">
      {lines.map((l, i) => <div key={i} className="md-line">{renderInline(l)}</div>)}
    </div>
  );
}

// ── Inline collapsible trace ──────────────────────────────────────────────────
function InlineTrace({ steps, total, running, activeIdx }) {
  const [open, setOpen] = useState(running);
  useEffect(() => { if (running) setOpen(true); }, [running]);

  const toneMap = { ok: "ok", mock: "warn", warn: "warn", err: "err" };

  return (
    <div className={`itrace ${open ? "is-open" : ""}`}>
      <button className="itrace-head" onClick={() => setOpen((v) => !v)}>
        {running ? <Spinner small /> : <Icon name="cpu" size={11} />}
        <span className="itrace-label">{running ? "Thinking…" : "Agent activity"}</span>
        <span className="itrace-meta mono">{total}</span>
        <span className="itrace-chev"><Icon name={open ? "chevdown" : "chev"} size={11} /></span>
      </button>
      {open && (
        <div className="itrace-body">
          {steps.map((s, i) => {
            const isActive = running && i === activeIdx;
            const isPending = running && i > activeIdx;
            const isDone = !running || i < activeIdx;
            return (
              <div key={i} className={`itrace-row ${isActive ? "is-active" : ""} ${isPending ? "is-pending" : ""}`}>
                <span className="itrace-gutter">
                  {isActive ? <Spinner small /> : isPending ? <span className="trace-dot-pending" /> : <Dot tone={toneMap[s.status] || "ok"} />}
                </span>
                <span className="mono itrace-name">{s.tool}</span>
                {isDone && s.note && <span className="itrace-note">{s.note}</span>}
                {isDone && s.ms != null && <span className="itrace-ms mono">{s.ms}ms</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Message components ────────────────────────────────────────────────────────
function UserMsg({ text }) {
  return (
    <div className="msg msg-user">
      <div className="msg-eyebrow"><span className="msg-role">You</span></div>
      <div className="msg-bubble">{text}</div>
    </div>
  );
}

function ArtifactChip({ a, onClick }) {
  if (a.kind === "seg") {
    return (
      <button className="art-chip art-seg" onClick={onClick}>
        <Mono dim>{a.id}</Mono>
        <span>{a.label}</span>
        <Icon name="arrow" size={10} />
      </button>
    );
  }
  return (
    <button className="art-chip art-link" onClick={onClick}>
      <span>{a.label}</span>
      <Icon name="arrow" size={10} />
    </button>
  );
}

function AgentMsg({ msg, running, activeIdx, onArtifact }) {
  return (
    <div className="msg msg-agent">
      <div className="msg-eyebrow">
        <span className="agent-mark"><Icon name="spark" size={9} /></span>
        <span className="msg-role">Campaign agent</span>
        {msg.advisories ? <Pill tone="warn" size="xs">{msg.advisories} advisories</Pill> : null}
      </div>

      {msg.trace && (
        <InlineTrace
          steps={msg.trace}
          total={msg.traceTotal || `${msg.trace.length} tools`}
          running={running}
          activeIdx={activeIdx}
        />
      )}

      {(!running || !msg.trace) && msg.text && (
        <div className="msg-body"><MD>{msg.text}</MD></div>
      )}

      {!running && msg.error && (
        <div className="msg-body" style={{ color: "var(--err)", fontSize: 13 }}>
          {msg.error}
        </div>
      )}

      {!running && msg.artifacts?.length > 0 && (
        <div className="msg-artifacts">
          {msg.artifacts.map((a, i) => (
            <ArtifactChip key={i} a={a} onClick={() => onArtifact(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Chat container ───────────────────────────────────────────────────────
export function Chat({ messages, running, activeIdx, onSend, onArtifact, suggestions, draft, setDraft }) {
  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    if (!draft.trim() || running) return;
    onSend(draft.trim());
  };

  const last = messages[messages.length - 1];
  const showFollowups = !running && last && last.role === "agent" && !last.error;

  return (
    <div className="chat">
      <div className="chat-head">
        <div className="chat-title">
          <span className="agent-mark agent-mark-lg"><Icon name="spark" size={11} /></span>
          <div>
            <div className="chat-title-t">Campaign agent</div>
            <div className="chat-title-s">
              <Dot tone="ok" /> ready
            </div>
          </div>
        </div>
        <button
          className="icon-btn icon-btn-sm"
          title="New conversation"
          onClick={() => window.location.reload()}
        >
          <Icon name="edit" size={12} />
        </button>
      </div>

      <div className="chat-thread">
        <div className="chat-thread-inner">
          {messages.length === 0 && (
            <div style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6, padding: "8px 0" }}>
              Describe a campaign objective — e.g. <em>"Increase ARPU of mid-ARPU customers by 2% in 30 days"</em>
            </div>
          )}
          {messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            return m.role === "user"
              ? <UserMsg key={m.id} text={m.text} />
              : (
                <AgentMsg
                  key={m.id}
                  msg={m}
                  running={running && isLast}
                  activeIdx={activeIdx}
                  onArtifact={onArtifact}
                />
              );
          })}
        </div>
      </div>

      <div className="chat-input-wrap">
        {showFollowups && suggestions?.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button key={s.id} className="suggestion" onClick={() => onSend(s.label)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className={`chat-input ${running ? "is-disabled" : ""}`}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={running ? "Agent is working…" : "Describe your campaign objective…"}
            rows={2}
            disabled={running}
          />
          <div className="chat-input-foot">
            <div className="chat-input-hint">
              <KBD>⌘</KBD><KBD>⏎</KBD>
            </div>
            <button
              className="send-btn"
              onClick={submit}
              disabled={!draft.trim() || running}
              title="Send"
            >
              {running ? <Spinner /> : <Icon name="arrow" size={13} stroke={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
