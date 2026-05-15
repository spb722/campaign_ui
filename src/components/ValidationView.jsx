import { Icon, Pill, Mono, Dot, SectionLabel } from "./atoms.jsx";

export function ValidationView({ validations, assumptions }) {
  const toneFor = (lvl) => lvl === "ok" ? "ok" : lvl === "advisory" ? "warn" : "err";
  const blocking = validations.filter((v) => v.level === "error").length;
  const advisories = validations.filter((v) => v.level === "advisory").length;

  return (
    <div className="valid">
      <div className="valid-l">
        <SectionLabel
          count={validations.length}
          action={
            blocking === 0
              ? <Pill tone="ok" size="xs">0 blocking</Pill>
              : <Pill tone="warn" size="xs">{blocking} blocking</Pill>
          }
        >
          Guardrails
        </SectionLabel>
        <div className="valid-list">
          {validations.map((v, i) => (
            <div key={i} className={`valid-row valid-${v.level}`}>
              <div className="valid-gutter"><Dot tone={toneFor(v.level)} /></div>
              <div className="valid-body">
                <div className="valid-head">
                  <span className="valid-code mono">{v.code}</span>
                  <Pill tone={v.level === "ok" ? "ok" : "warn"} size="xs">{v.level}</Pill>
                </div>
                <div className="valid-msg">{v.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="valid-r">
        <SectionLabel>Assumptions</SectionLabel>
        <div className="assum">
          {assumptions.map((a, i) => (
            <div key={i} className="assum-row">
              <span className="assum-k mono">{a.k}</span>
              <span className="assum-v">{a.v}</span>
              <span className="assum-src">{a.src}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
