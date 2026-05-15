// Atomic UI primitives — Icon, Pill, Mono, Dot, Bar, KBD, SectionLabel, Spinner

const ICON_PATHS = {
  spark:    "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  play:     "M6 4l14 8L6 20z",
  arrow:    "M5 12h14M13 6l6 6-6 6",
  check:    "M5 12l4 4 10-10",
  info:     "M12 8v.01M11 12h1v4h1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  warn:     "M12 9v4M12 17v.01M10.3 3.7L2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z",
  chev:     "M9 6l6 6-6 6",
  chevdown: "M6 9l6 6 6-6",
  copy:     "M9 9h10v10H9zM5 5h10v3M5 5v10h3",
  download: "M12 4v12M6 12l6 6 6-6M4 20h16",
  refresh:  "M21 12a9 9 0 1 1-3.5-7.1M21 4v5h-5",
  eye:      "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  close:    "M6 6l12 12M18 6L6 18",
  edit:     "M4 20h4l10-10-4-4L4 16v4zM14 6l4 4",
  bolt:     "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  cpu:      "M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6z",
  target:   "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 12m-5 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0",
  flow:     "M4 6h10M4 12h16M4 18h7",
  flask:    "M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3",
  sliders:  "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M18 18h2M14 4v4M8 10v4M16 16v4",
  history:  "M3 12a9 9 0 1 0 3-6.7M3 3v5h5M12 7v5l3 2",
  dot:      "M12 12.01",
};

export function Icon({ name, size = 14, stroke = 1.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "none" }}
    >
      <path d={ICON_PATHS[name] || ICON_PATHS.dot} />
    </svg>
  );
}

export function Pill({ children, tone = "neutral", size = "sm" }) {
  return <span className={`pill pill-${tone} pill-${size}`}>{children}</span>;
}

export function Mono({ children, dim = false }) {
  return <span className={`mono ${dim ? "mono-dim" : ""}`}>{children}</span>;
}

export function Dot({ tone = "ok" }) {
  return <span className={`dot dot-${tone}`} />;
}

export function Bar({ value, tone = "ink" }) {
  return (
    <div className="bar-track">
      <div className={`bar-fill bar-${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function KBD({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function SectionLabel({ children, count, action }) {
  return (
    <div className="section-label">
      <span className="section-label-text">{children}</span>
      {count != null && <span className="section-label-count">{count}</span>}
      <span className="section-label-rule" />
      {action}
    </div>
  );
}

export function Spinner({ small = false }) {
  return <span className={`spinner${small ? " spinner-sm" : ""}`} />;
}
