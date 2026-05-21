import { Pill, Mono, SectionLabel } from "./atoms.jsx";

function fmtDate(isoStr, tz) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: tz || undefined,
  });
}

function fmtTime(isoStr, tz) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz || undefined,
  });
}

function waveDate(startIso, dayOffset, tz) {
  if (!startIso) return "—";
  const d = new Date(startIso);
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: tz || undefined,
  });
}

function buildWaves(planTimeline, schedule) {
  // planTimeline entries already have { d: "D N", label, sub }
  return planTimeline.map((e) => {
    const dayOffset = parseInt(e.d.replace("D ", ""), 10);
    return {
      ...e,
      dayOffset,
      date: waveDate(schedule?.start_datetime, dayOffset, schedule?.timezone),
    };
  });
}

function collectChannelWindows(segments) {
  // Merge all channel_time_windows from all segments (identical across segs)
  const merged = {};
  segments.forEach((s) => {
    Object.entries(s.channelTimeWindows || {}).forEach(([ch, win]) => {
      if (!merged[ch]) merged[ch] = win;
    });
  });
  return Object.entries(merged).map(([ch, win]) => ({
    ch: ch === "whatsapp" ? "WhatsApp" : ch.charAt(0).toUpperCase() + ch.slice(1),
    win,
  }));
}

export function ScheduleView({ schedule, planTimeline, segments }) {
  if (!schedule) {
    return (
      <div className="valid">
        <div className="valid-l">
          <SectionLabel>Schedule</SectionLabel>
          <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 8 }}>
            No schedule set. Ask the agent to schedule this campaign (e.g. "schedule it to start tomorrow at 9am for 30 days").
          </p>
        </div>
      </div>
    );
  }

  const tz = schedule.timezone || "UTC";
  const waves = buildWaves(planTimeline, schedule);
  const channelWindows = collectChannelWindows(segments);
  const respectBestTime = schedule.respect_channel_best_time !== false;

  return (
    <div className="valid">
      {/* Banner */}
      <div style={{
        gridColumn: "1 / -1",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>
            {fmtDate(schedule.start_datetime, tz)}{" "}
            <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>·</span>{" "}
            <Mono dim>{fmtTime(schedule.start_datetime, tz)}</Mono>
            {" "}
            <span style={{ color: "var(--ink-3)" }}>────────────────</span>
            {" "}
            {fmtDate(schedule.end_datetime, tz)}{" "}
            <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>·</span>{" "}
            <Mono dim>{fmtTime(schedule.end_datetime, tz)}</Mono>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill tone="warm" size="xs">{schedule.schedule_mode || "drip"}</Pill>
            <Pill tone="ink" size="xs">{schedule.duration_days}d</Pill>
            <Pill tone={schedule.status === "scheduled" ? "ok" : "warn"} size="xs">{schedule.status}</Pill>
            <Mono dim style={{ fontSize: 11 }}>{tz}</Mono>
          </div>
        </div>
        {schedule.source && (
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            source: <Mono dim>{schedule.source}</Mono>
          </div>
        )}
      </div>

      {/* Left — Send Waves */}
      <div className="valid-l">
        <SectionLabel count={waves.length}>Send Waves</SectionLabel>
        <div className="valid-list">
          {waves.map((w, i) => (
            <div key={i} className="valid-row valid-ok">
              <div className="valid-gutter">
                <Mono dim style={{ fontSize: 10, minWidth: 32 }}>D+{w.dayOffset}</Mono>
              </div>
              <div className="valid-body">
                <div className="valid-head">
                  <span className="valid-code mono">{w.date}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{w.sub}</span>
                </div>
                <div className="valid-msg" style={{ fontSize: 12 }}>{w.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Channel Windows + Notes */}
      <div className="valid-r">
        <SectionLabel count={channelWindows.length}>Channel Send Windows</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {channelWindows.map((c, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 10px",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontSize: 12,
            }}>
              <span style={{ fontWeight: 500, color: "var(--ink-1)" }}>{c.ch}</span>
              <Mono dim style={{ fontSize: 11 }}>{c.win}</Mono>
            </div>
          ))}
        </div>

        {!respectBestTime && (
          <div style={{
            background: "color-mix(in srgb, var(--warn-bg, #fffbea) 60%, transparent)",
            border: "1px solid var(--warn, #d4a017)",
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 16,
            fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: "var(--warn-fg, #92400e)", marginBottom: 4 }}>
              ⚠ respect_channel_best_time OFF
            </div>
            <div style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
              Sends scheduled at wave start time, not at channel-optimal windows shown above.
            </div>
          </div>
        )}

        {(schedule.assumptions || []).length > 0 && (
          <>
            <SectionLabel>Assumptions</SectionLabel>
            <div className="assum">
              {schedule.assumptions.map((a, i) => (
                <div key={i} className="assum-row">
                  <span className="assum-v" style={{ color: "var(--ink-2)", fontSize: 12 }}>· {a}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
