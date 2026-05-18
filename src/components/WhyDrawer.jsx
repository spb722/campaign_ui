import { Icon, Mono, Bar, Dot } from "./atoms.jsx";

function DrawerSection({ label, children }) {
  return (
    <div className="drawer-section">
      <div className="drawer-section-label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export function WhyDrawer({ open, seg, kind, onClose }) {
  if (!open || !seg) return null;

  const title = kind === "tactic" ? "Why this tactic?" : "Why this channel mix?";

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-head">
          <div>
            <div className="drawer-eyebrow">
              <Mono dim>{seg.id}</Mono> · {seg.name}
            </div>
            <h2 className="drawer-title">{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className="drawer-body">
          {kind === "tactic" ? (
            <TacticDrawer seg={seg} />
          ) : (
            <ChannelDrawer seg={seg} />
          )}
        </div>
      </aside>
    </>
  );
}

function TacticDrawer({ seg }) {
  return (
    <>
      <DrawerSection label="Why this segment?">
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
          {seg.whyThis}
        </div>
      </DrawerSection>

      <DrawerSection label="Rulebook match">
        <div className="rb-card">
          <div className="rb-card-row"><span>Trend</span><span>{seg.rulebookTrend}</span></div>
          <div className="rb-card-row"><span>Action</span><span>{seg.rulebookAction}</span></div>
          <div className="rb-card-row"><span>Allowed families</span><span>{seg.allowedFamilies?.join(", ")}</span></div>
          <div className="rb-card-row"><span>Opportunity</span><span>{seg.opportunity}</span></div>
          <div className="rb-card-row"><span>NBO action</span><span>{seg.nboAction}</span></div>
        </div>
      </DrawerSection>

      <DrawerSection label="Offer selected">
        <div className="offer">
          <div className="offer-name">{seg.tactic.name}</div>
          <div className="offer-desc">{seg.tactic.desc}</div>
          <div className="offer-grid">
            <div><span>Cost / user</span><Mono>{seg.tactic.cost}</Mono></div>
            <div><span>Expected lift</span><Mono>{seg.lift}</Mono></div>
            <div><span>Target conv.</span><Mono>{seg.conv}</Mono></div>
            <div><span>Price</span><Mono>RO {seg.tactic.price}</Mono></div>
            <div><span>Benefit</span><Mono>{seg.tactic.benefit}</Mono></div>
            <div><span>Validity</span><Mono>{seg.tactic.validityDays}d</Mono></div>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection label="Projection">
        <div className="proj-formula">
          <span><Mono>{seg.customerCount?.toLocaleString()}</Mono> users</span>
          <span className="proj-op">×</span>
          <span><Mono>{seg.conv}</Mono> conv</span>
          <span className="proj-op">×</span>
          <span><Mono>{seg.lift}</Mono> lift</span>
          <span className="proj-op">=</span>
          <span className="proj-out"><Mono>{seg.revLift}</Mono></span>
        </div>
      </DrawerSection>

      <DrawerSection label="Segment profile">
        <div className="rb-card">
          <div className="rb-card-row"><span>Data trend</span><span>{seg.dataTrend}</span></div>
          <div className="rb-card-row"><span>Voice trend</span><span>{seg.trend}</span></div>
          <div className="rb-card-row"><span>Churn risk</span><span>{seg.churnRisk}</span></div>
          <div className="rb-card-row"><span>Activity score</span><span>{seg.activityScore}</span></div>
        </div>
      </DrawerSection>
    </>
  );
}

function ChannelDrawer({ seg }) {
  // Build full channel list sorted by score
  const allChannels = seg.channelScoresRaw
    ? Object.entries(seg.channelScoresRaw)
        .sort((a, b) => b[1] - a[1])
        .map(([ch, score]) => ({
          ch,
          score,
          primary: ch === seg.bestChannel,
          window: seg.channelTimeWindows?.[ch] ??
            (ch === seg.bestChannel ? seg.bestTime : "10:00-18:00"),
        }))
    : seg.channels.map((c) => ({
        ch: c.ch.toLowerCase(),
        score: c.score,
        primary: c.primary,
        window: c.window,
      }));

  const chLabel = (ch) => ch === "whatsapp" ? "WhatsApp" : ch === "outbound_call" ? "Outbound call" : ch.charAt(0).toUpperCase() + ch.slice(1);

  return (
    <>
      <DrawerSection label="Why this channel?">
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
          {seg.whyThis}
        </div>
      </DrawerSection>

      <DrawerSection label="ML scores · all channels">
        <div className="ml-table">
          {allChannels.map((c, i) => (
            <div key={i} className={`ml-row ${c.primary ? "is-primary" : ""}`}>
              <span>{chLabel(c.ch)}</span>
              <span>{c.window}</span>
              <Bar value={c.score * 100} tone={c.primary ? "accent" : "ink-soft"} />
              <Mono>{c.score.toFixed(2)}</Mono>
            </div>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection label="Selection rationale">
        <ul className="rationale">
          <li>Highest model score among supported channels for this segment.</li>
          <li>Send window <Mono>{seg.bestTime}</Mono> matches peak engagement hours.</li>
          <li>Fatigue risk is <Mono>{seg.fatigueRisk}</Mono> — within 4-send / 30-day cap.</li>
          <li>Expected CTR: <Mono>{(seg.expectedCtr * 100).toFixed(1)}%</Mono></li>
          <li>Expected conversion: <Mono>{seg.conv}</Mono></li>
        </ul>
      </DrawerSection>

      <DrawerSection label="Model meta">
        <div className="meta-grid">
          <div><span>Confidence</span><Mono>{seg.modelConfidence?.toFixed(2)}</Mono></div>
          <div><span>Fatigue risk</span><Mono>{seg.fatigueRisk}</Mono></div>
          <div><span>Best time</span><Mono>{seg.bestTime}</Mono></div>
          <div><span>Source</span><Mono dim>{seg.fallbackUsed ? "Fallback default" : "ML-score based"}</Mono></div>
        </div>
      </DrawerSection>
    </>
  );
}
