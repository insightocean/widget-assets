// Main app — orchestrates stage transitions, dimensions, key handlers.

const { useState, useEffect, useRef } = React;
const M_app = window.motion;
const AP_app = window.AnimatePresence;

function App() {
  const [stage, setStage] = useState("launch"); // launch | stage1 | stage2
  const [launchVisible, setLaunchVisible] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [eyeOpen, setEyeOpen] = useState(false);
  const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setDim({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Square stage: the whole experience lives in a centered square so it crops
  // beautifully into a 1:1 embed. PAD gives breathing room inside the square.
  const PAD = 8;
  const SQ = Math.max(0, Math.min(dim.w, dim.h));
  const sqLeft = (dim.w - SQ) / 2;
  const sqTop = (dim.h - SQ) / 2;
  const layoutDim = { w: SQ - PAD * 2, h: SQ - PAD * 2 };

  // Auto-advance stage1 -> stage2 after the (shortened) opening choreography
  useEffect(() => {
    if (stage !== "stage1") return;
    const t = setTimeout(() => setStage("stage2"), 4100);
    return () => clearTimeout(t);
  }, [stage]);

  // Esc to back out of detail or eye state
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setEyeOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedStep =
    selectedId !== null ? window.STEPS.find((s) => s.id === selectedId) : null;

  return (
    <div
      className="app-root"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {/* Centered square stage — the whole composition lives here so it crops
          cleanly into a 1:1 embed. */}
      <div
        className="square-stage"
        style={{
          position: "absolute",
          left: sqLeft,
          top: sqTop,
          width: SQ,
          height: SQ,
          overflow: "hidden",
        }}
      >
      {/* Paper background — painted on body via CSS, no fade needed */}
      {/* Subtle warm tint overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(217,120,66,0.04) 0%, rgba(127,168,201,0.03) 60%, rgba(51,41,29,0.06) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Room-dim overlay (eye-open state) — softens & warms the paper */}
      <M_app.div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(232,227,212,0.0) 0%, rgba(232,227,212,0.18) 70%, rgba(232,227,212,0.32) 100%)",
          mixBlendMode: "screen",
          zIndex: 1,
        }}
        animate={{ opacity: eyeOpen ? 1 : 0 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Padded layout box — gives the orbit + labels breathing room inside
          the square so labels never crash into the crop edge. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: PAD,
          right: PAD,
          bottom: PAD,
          overflow: "visible",
        }}
      >
        {/* Orbit composition — starts rendering as soon as launch is clicked,
            drawing the hexagon underneath while Launch fades out. */}
        {stage !== "launch" && (
          <Orbit
            stage={stage}
            selectedId={selectedId}
            onSelect={(id) => stage === "stage2" && setSelectedId(id)}
            eyeOpen={eyeOpen}
            onEyeClick={() => stage === "stage2" && !selectedId && setEyeOpen(true)}
            onEyeBack={() => setEyeOpen(false)}
            onEyeDoubleClick={() => {
              setSelectedId(null);
              setEyeOpen(false);
              setStage("launch");
              setLaunchVisible(true);
            }}
            dimensions={layoutDim}
            fromLaunch={false}
          />
        )}

        {/* Launch screen — kept mounted briefly during stage1 so the icon's
            fade-out crosses over the hexagon's draw-in */}
        {launchVisible && (
          <Launch
            dimensions={layoutDim}
            onLaunch={() => {
              setStage("stage1");
              setTimeout(() => setLaunchVisible(false), 1500);
            }}
          />
        )}
      </div>

      {/* Detail overlay — confined to the padded square */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: PAD,
          right: PAD,
          bottom: PAD,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <AP_app mode="wait">
          {selectedStep && (
            <StepDetail
              key={selectedStep.id}
              step={selectedStep}
              onBack={() => setSelectedId(null)}
              dimensions={layoutDim}
            />
          )}
        </AP_app>
      </div>

      {/* Footer mark — appears once we're past the launch screen */}
      {stage !== "launch" && (
        <M_app.div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 18,
            textAlign: "center",
            fontFamily: "'Tiempos Text', Georgia, serif",
            fontStyle: "italic",
            fontSize: 13,
            color: "rgba(51,41,29,0.45)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.4 }}
        >
          Six Steps to Liberation — Alex Shailer
        </M_app.div>
      )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
