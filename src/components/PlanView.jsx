import { Icon, Mono, SectionLabel } from "./atoms.jsx";

export function PlanView({ segments, planTimeline }) {
  const hours = ["06", "09", "12", "15", "18", "21"];

  return (
    <div className="plan">
      <div className="plan-l">
        <SectionLabel>Sequence (30 days)</SectionLabel>
        <div className="timeline">
          {planTimeline.map((step, i) => (
            <div key={i} className="tl-row">
              <div className="tl-day"><Mono>{step.d}</Mono></div>
              <div className={`tl-marker tl-${step.tone}`} />
              <div className="tl-body">
                <div className="tl-label">{step.label}</div>
                <div className="tl-sub">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="plan-r">
        <SectionLabel
          action={
            <span className="legend">
              <span className="legend-swatch swatch-1" />low
              <span className="legend-swatch swatch-2" />mid
              <span className="legend-swatch swatch-3" />high
            </span>
          }
        >
          Send-window heatmap
        </SectionLabel>
        <div className="heat">
          <div className="heat-col-labels">
            <div />
            {hours.map((h) => <div key={h} className="heat-hour"><Mono>{h}:00</Mono></div>)}
          </div>
          {segments.map((s) => {
            const peakHour = s.bestTime ? parseInt(s.bestTime.split(":")[0], 10) : 18;
            return (
              <div key={s.id} className="heat-row">
                <div className="heat-label">
                  <Mono dim>{s.id}</Mono>
                  <span style={{ textTransform: "capitalize" }}>{s.bestChannel}</span>
                </div>
                {hours.map((h) => {
                  const hi = parseInt(h, 10);
                  const d = Math.abs(hi - peakHour);
                  const intensity = d === 0 ? 3 : d <= 3 ? 2 : d <= 6 ? 1 : 0;
                  return <div key={h} className={`heat-cell heat-${intensity}`} />;
                })}
              </div>
            );
          })}
        </div>

        <div className="quiet-hours">
          <Icon name="info" size={12} />
          <span>
            Quiet hours <Mono>22:00–08:00</Mono> enforced. No sends scheduled inside this window.
          </span>
        </div>
      </div>
    </div>
  );
}
