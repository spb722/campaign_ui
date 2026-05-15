import { useState, useEffect, useRef } from "react";
import { parseCampaign } from "./api.js";
import { transformApiResponse } from "./dataTransform.js";
import { buildAgentTrace, buildFollowupReplies, buildFollowups, EXAMPLE_PROMPTS } from "./mockData.js";
import { Icon, Pill, Mono, Dot } from "./components/atoms.jsx";
import { Chat } from "./components/Chat.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { KPIStrip } from "./components/KPIStrip.jsx";
import { SegmentsView } from "./components/SegmentsView.jsx";
import { PlanView } from "./components/PlanView.jsx";
import { ContentView } from "./components/ContentView.jsx";
import { ValidationView } from "./components/ValidationView.jsx";
import { ExportView } from "./components/ExportView.jsx";
import { WhyDrawer } from "./components/WhyDrawer.jsx";

// ── Color helpers ─────────────────────────────────────────────────────────────
function parseHex(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function hexToTint(hex, alpha) {
  const { r, g, b } = parseHex(hex);
  const bg = { r: 250, g: 247, b: 241 };
  const mix = (c1, c2) => Math.round(c1 * alpha + c2 * (1 - alpha));
  return `rgb(${mix(r,bg.r)},${mix(g,bg.g)},${mix(b,bg.b)})`;
}
function shade(hex, amt) {
  const { r, g, b } = parseHex(hex);
  const adj = (c) => Math.max(0, Math.min(255, c + amt));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

function guessIntent(text) {
  const s = text.toLowerCase();
  if (/why.*(push|whatsapp|sms|channel)/.test(s)) return "channel-why";
  if (/regenerate|redo.*content/.test(s)) return "regen";
  if (/inactive|churn/.test(s)) return "filter";
  if (/rulebook|why.*tactic/.test(s)) return "rulebook";
  return null;
}

export default function App() {
  // Campaign state
  const [campaignData, setCampaignData] = useState(null);

  // Chat
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState("");

  // Canvas
  const [tab, setTab] = useState("segments");
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [why, setWhy] = useState({ open: false, seg: null, kind: null });

  // Resizable rail
  const [railW, setRailW] = useState(() => {
    const saved = parseInt(localStorage.getItem("railW") || "0", 10);
    return saved >= 280 && saved <= 720 ? saved : 360;
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--rail-w", railW + "px");
    localStorage.setItem("railW", String(railW));
  }, [railW]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setRailW(Math.min(720, Math.max(280, e.clientX)));
    const onUp = () => setDragging(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // Replay agent trace animation
  const runTrace = (steps, onDone) => {
    let i = 0;
    setActiveStep(0);
    const tick = () => {
      if (i >= steps.length) {
        setRunning(false);
        setActiveStep(steps.length);
        onDone?.();
        return;
      }
      setActiveStep(i);
      const dur = Math.min(700, Math.max(150, steps[i].ms / 4));
      i += 1;
      setTimeout(tick, dur);
    };
    tick();
  };

  const sendMessage = async (text, intent) => {
    if (!text || running) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setDraft("");
    setRunning(true);

    // Check if this is a follow-up (only valid when campaign already loaded)
    const resolvedIntent = intent || guessIntent(text);
    const followupReplies = campaignData ? buildFollowupReplies(campaignData) : {};

    if (campaignData && resolvedIntent && followupReplies[resolvedIntent]) {
      const template = { ...followupReplies[resolvedIntent], id: `a-${Date.now()}`, role: "agent" };
      setMessages((prev) => [...prev, userMsg, template]);
      runTrace(template.trace, () => {
        if (template.artifacts) {
          const segArt = template.artifacts.find((a) => a.kind === "seg");
          const tabArt = template.artifacts.find((a) => a.kind === "tab");
          if (segArt) { setTab("segments"); setSelectedSegId(segArt.id); }
          if (tabArt) setTab(tabArt.id);
        }
      });
      return;
    }

    // Full campaign parse via API
    const trace = buildAgentTrace(null);
    const agentMsg = {
      id: `a-${Date.now()}`,
      role: "agent",
      trace,
      traceTotal: `${trace.length} tools`,
      text: null,
      artifacts: null,
      advisories: 0,
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);

    try {
      // Animate trace while API call is in flight
      const tracePromise = new Promise((resolve) => {
        let i = 0;
        setActiveStep(0);
        const tick = () => {
          if (i >= trace.length) { resolve(); return; }
          setActiveStep(i);
          const dur = Math.min(700, Math.max(150, trace[i].ms / 4));
          i += 1;
          setTimeout(tick, dur);
        };
        tick();
      });

      const [apiResult] = await Promise.all([parseCampaign(text), tracePromise]);

      const data = transformApiResponse(apiResult);
      const enrichedTrace = buildAgentTrace(data);

      const totalImpact = data.totalImpact?.toFixed(0) || "—";
      const segCount = data.segments.length;
      const totalUsers = data.totalUsers?.toLocaleString() || "—";
      const advisories = (data.validations || []).filter((v) => v.level === "advisory").length;

      const finalArtifacts = data.segments.slice(0, 5).map((s) => ({
        kind: "seg", id: s.id, label: s.name,
      }));

      setMessages((prev) => prev.map((m) =>
        m.id === agentMsg.id
          ? {
              ...m,
              trace: enrichedTrace,
              traceTotal: `${enrichedTrace.length} tools`,
              text: `**Plan ready.** ${segCount} segments cover **${totalUsers}** eligible users. Projected **RO ${totalImpact}** incremental revenue.`,
              artifacts: finalArtifacts,
              advisories,
            }
          : m
      ));

      setCampaignData(data);
      setSelectedSegId(data.segments[0]?.id || null);
      setTab("segments");
      setRunning(false);
      setActiveStep(enrichedTrace.length);
    } catch (err) {
      setMessages((prev) => prev.map((m) =>
        m.id === agentMsg.id
          ? { ...m, text: null, error: `API error: ${err.message}`, trace: m.trace }
          : m
      ));
      setRunning(false);
      setActiveStep(trace.length);
    }
  };

  const handleArtifact = (a) => {
    if (a.kind === "seg") {
      setTab("segments");
      setSelectedSegId(a.id);
      document.querySelector(".canvas")?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (a.kind === "tab") {
      setTab(a.id);
    } else if (a.kind === "drawer") {
      const seg = campaignData?.segments.find((s) => s.id === a.segId);
      if (seg) setWhy({ open: true, seg, kind: a.drawerKind });
    }
  };

  const tabs = campaignData
    ? [
        { id: "segments",   label: "Segments",   count: campaignData.segments.length },
        { id: "plan",       label: "Plan",        count: campaignData.planTimeline.length },
        { id: "content",    label: "Content",     count: campaignData.contentDrafts.length },
        { id: "validation", label: "Validation",  count: campaignData.validations.length },
        { id: "export",     label: "Export",      count: null },
      ]
    : [];

  const advisoryCount = (campaignData?.validations || []).filter((v) => v.level === "advisory").length;
  const errorCount = (campaignData?.validations || []).filter((v) => v.level === "error").length;

  const followups = campaignData ? buildFollowups(campaignData) : [];

  return (
    <div className="app">
      <Topbar campaignId={campaignData?.campaignId} campaignTitle={campaignData?.campaignTitle} />

      <div className="shell">
        {/* Left rail — chat */}
        <aside className="rail">
          <Chat
            messages={messages}
            running={running}
            activeIdx={activeStep}
            onSend={sendMessage}
            onArtifact={handleArtifact}
            suggestions={followups}
            draft={draft}
            setDraft={setDraft}
          />
        </aside>

        {/* Resizer */}
        <div
          className={`resizer ${dragging ? "is-dragging" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
          onDoubleClick={() => setRailW(360)}
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize · double-click to reset"
        >
          <span className="resizer-grip" />
        </div>

        {/* Main canvas */}
        <main className="canvas">
          {!campaignData ? (
            <EmptyState onSend={sendMessage} setDraft={setDraft} />
          ) : (
            <div className="canvas-inner">
              {/* Hero */}
              <section className="hero">
                <div className="hero-l">
                  <div className="hero-eyebrow">
                    <Pill tone="warm" size="xs">{campaignData.campaignId}</Pill>
                    <span>{campaignData.campaignIntent?.replace(/_/g, " ")} · {campaignData.parsed?.time_window_value}d</span>
                    <span className="crumb-sep">·</span>
                    <Mono dim>{campaignData.parsed?.business_context}</Mono>
                  </div>
                  <h1 className="hero-title">
                    {campaignData.campaignTitle}
                  </h1>
                  <p className="hero-sub">
                    {campaignData.segments.length} segments · <strong>{campaignData.totalUsers?.toLocaleString()}</strong> eligible users.
                    Projected <strong>RO {campaignData.totalImpact?.toLocaleString("en", { maximumFractionDigits: 0 })}</strong> incremental revenue
                    at <strong>RO {campaignData.estCost?.toLocaleString("en", { maximumFractionDigits: 0 })}</strong> estimated offer cost.
                  </p>
                </div>
                <div className="hero-r">
                  <div className="hero-status">
                    <Dot tone={errorCount > 0 ? "err" : "ok"} />
                    <strong style={{ color: errorCount > 0 ? "var(--err)" : "var(--ok)" }}>
                      {errorCount > 0 ? "Has blocking errors" : "Plan ready"}
                    </strong>
                    <span className="crumb-sep">·</span>
                    <span>{errorCount} blocking · {advisoryCount} advisories</span>
                  </div>
                  <div className="hero-status">
                    <Icon name="history" size={12} />
                    <span>Status: <Mono>{campaignData.status}</Mono> · v{campaignData.version}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDraft("Regenerate the campaign plan")}>
                      <Icon name="refresh" size={11} />Re-run
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab("export")}>
                      <Icon name="download" size={11} />Export
                    </button>
                  </div>
                </div>
              </section>

              <KPIStrip kpis={campaignData.kpis} />

              {/* Tabs */}
              <nav className="tabs">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    className={`tab ${tab === t.id ? "is-active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    <span>{t.label}</span>
                    {t.count != null && <span className="tab-count">{t.count}</span>}
                  </button>
                ))}
                <div className="tabs-spacer" />
                <div className="tabs-meta">
                  <Pill tone="ok" size="xs">rulebook matched</Pill>
                </div>
              </nav>

              {tab === "segments" && (
                <SegmentsView
                  segments={campaignData.segments}
                  selectedId={selectedSegId}
                  onSelect={setSelectedSegId}
                  onOpenWhy={(s, k) => setWhy({ open: true, seg: s, kind: k })}
                />
              )}
              {tab === "plan" && (
                <PlanView
                  segments={campaignData.segments}
                  planTimeline={campaignData.planTimeline}
                />
              )}
              {tab === "content" && (
                <ContentView drafts={campaignData.contentDrafts} />
              )}
              {tab === "validation" && (
                <ValidationView
                  validations={campaignData.validations}
                  assumptions={campaignData.assumptions}
                />
              )}
              {tab === "export" && <ExportView campaignData={campaignData} />}
            </div>
          )}
        </main>
      </div>

      <WhyDrawer
        open={why.open}
        seg={why.seg}
        kind={why.kind}
        onClose={() => setWhy({ open: false, seg: null, kind: null })}
      />
    </div>
  );
}

// ── Empty / onboarding state ──────────────────────────────────────────────────
function EmptyState({ onSend, setDraft }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 100px)",
      gap: 32,
      padding: "40px 36px",
      textAlign: "center",
    }}>
      <div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 360,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          marginBottom: 12,
        }}>
          Campaign Workspace
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
          Describe your campaign objective in the chat panel. The agent will parse it,
          find segments, score channels, and draft a full campaign plan.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", marginBottom: 4 }}>
          Try one of these
        </div>
        {EXAMPLE_PROMPTS.map((p, i) => (
          <button
            key={i}
            className="example"
            style={{ textAlign: "left", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface)" }}
            onClick={() => {
              setDraft(p);
              document.querySelector(".chat-input textarea")?.focus();
            }}
          >
            <span className="example-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="example-text">{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
