// Stage 3 — detail panel for a selected step.
// The icon itself stays in place in the orbit (handled by Orbit) and just scales up.
// This component renders only the text panel + back link.

const M_d = window.motion;

// Step index (0-5) → which screen quadrant the icon sits in.
// 0 top, 1 top-right, 2 bottom-right, 3 bottom, 4 bottom-left, 5 top-left
// Always position the popup on the right so the left side is reserved for
// an external camera overlay.
function panelSideFor(stepId) {
  return "right";
}

function StepDetail({ step, onBack, dimensions }) {
  if (!step) return null;
  const { w, h } = dimensions;

  // Square-format popup: a centered column with stylish side margins.
  // Wide enough to read comfortably on mobile, capped on large squares.
  const sideMargin = Math.max(w * 0.075, 26);
  const panelWidth = Math.min(w - sideMargin * 2, 720);
  const panelLeft = (w - panelWidth) / 2;
  const panelTop = Math.max(h * 0.1, 68);
  const panelMaxHeight = h - panelTop * 1.7;

  return (
    <M_d.div
      key={step.id}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "auto",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Click-outside catcher */}
      <div
        onClick={onBack}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "default",
        }}
      />

      {/* Back link */}
      <M_d.button
        type="button"
        onClick={onBack}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        style={{
          position: "absolute",
          left: 36,
          top: 30,
          background: "transparent",
          border: "none",
          color: "#33291D",
          fontFamily: "'Tiempos Text', Georgia, serif",
          fontSize: 16,
          fontStyle: "italic",
          cursor: "pointer",
          opacity: 0.75,
          letterSpacing: "0.01em",
          padding: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
      >
        ← back
      </M_d.button>

      {/* Text panel */}
      <M_d.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          maxHeight: panelMaxHeight,
          overflowY: "auto",
          paddingRight: 6,
          paddingLeft: 6,
          paddingBottom: 40,
          fontFamily: "'Tiempos Text', Georgia, serif",
          color: "#33291D",
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--orange)",
            marginBottom: 10,
            fontStyle: "italic",
          }}
        >
          Step {step.numeral}
        </div>
        <h1
          style={{
            fontFamily: "'Tiempos Headline', 'Tiempos Text', Georgia, serif",
            fontSize: "clamp(26px, 2.5vw, 38px)",
            lineHeight: 1.15,
            fontWeight: 500,
            margin: "0 0 22px 0",
            letterSpacing: "-0.012em",
            textWrap: "pretty",
          }}
        >
          {step.body.heading}
        </h1>

        {/* Editorial divider — thin line with diamond ornament */}
        <svg
          width="160"
          height="14"
          viewBox="0 0 160 14"
          style={{ display: "block", marginBottom: 22 }}
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="7"
            x2="68"
            y2="7"
            stroke="var(--orange)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <line
            x1="92"
            y1="7"
            x2="160"
            y2="7"
            stroke="var(--orange)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M80 2 L86 7 L80 12 L74 7 Z"
            fill="none"
            stroke="var(--orange)"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
          <circle cx="80" cy="7" r="1.2" fill="var(--orange)" />
        </svg>

        {step.body.intro && (
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.55,
              margin: "0 0 18px 0",
              fontStyle: "italic",
              color: "rgba(51,41,29,0.88)",
            }}
          >
            {step.body.intro}
          </p>
        )}

        <ol
          style={{
            margin: 0,
            paddingLeft: 24,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          {step.body.points.map((pt, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <span>{pt.text}</span>
              {pt.subs && (
                <ul
                  style={{
                    margin: "8px 0 0 0",
                    paddingLeft: 22,
                    listStyle: "none",
                  }}
                >
                  {pt.subs.map((s, j) => (
                    <li
                      key={j}
                      style={{
                        marginBottom: 6,
                        position: "relative",
                        paddingLeft: 18,
                        color: "rgba(51,41,29,0.85)",
                        fontSize: 15,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: "var(--orange)",
                        }}
                      >
                        —
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        {step.body.outro && (
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.6,
              margin: "22px 0 0 0",
              fontStyle: "italic",
              color: "rgba(51,41,29,0.78)",
              borderTop: "1px solid rgba(51,41,29,0.18)",
              paddingTop: 16,
            }}
          >
            {step.body.outro}
          </p>
        )}

        {step.body.pointers && (
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid rgba(51,41,29,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--sky-deep)",
                marginBottom: 10,
                fontStyle: "italic",
              }}
            >
              Pointers
            </div>
            {step.body.pointers.map((p, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'Tiempos Text', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 18,
                  lineHeight: 1.5,
                  color: "#33291D",
                  marginBottom: 4,
                }}
              >
                "{p}"
              </div>
            ))}
          </div>
        )}
      </M_d.div>
    </M_d.div>
  );
}

Object.assign(window, { StepDetail });
