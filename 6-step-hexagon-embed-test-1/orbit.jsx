// Orbit composition — hexagon + center image + radial connectors + 6 icons.
// Pure presentation; receives stage + selectedStep + handlers from App.

const { motion, AnimatePresence } = window.Motion || window.framerMotion || {};
const M = window.motion;

// Hexagon math: vertices on a circle at angles starting from top, clockwise.
// Step 1 at top (-90°), then clockwise every 60°.
function hexVertex(cx, cy, r, i) {
  const angleDeg = -90 + i * 60;
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), angle: angleDeg };
}

// Build SVG path for hexagon outline starting at top vertex going clockwise.
function hexPath(cx, cy, r) {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const v = hexVertex(cx, cy, r, i);
    d += (i === 0 ? "M" : "L") + v.x.toFixed(2) + "," + v.y.toFixed(2) + " ";
  }
  return d + "Z";
}

// Where the icon orbit sits (radius from center, larger than hex).
function iconPos(cx, cy, rOrbit, i) {
  return hexVertex(cx, cy, rOrbit, i);
}

// Label-side decision for each step index.
function labelPlacement(i) {
  // i: 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
  return ["top", "right", "right", "bottom", "left", "left"][i];
}

function Orbit({ stage, onSelect, selectedId, eyeOpen, onEyeClick, onEyeBack, onEyeDoubleClick, dimensions, fromLaunch }) {
  const W = dimensions.w;
  const H = dimensions.h;

  // Preload + decode all step icons + the centerpiece BEFORE the icon stage
  // animates them in, so they don't visibly wipe from top while decoding.
  const [iconsReady, setIconsReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    const urls = [
      ...window.STEPS.map((s) => s.icon),
      "assets/hexagon-center.png",
    ];
    Promise.all(
      urls.map((src) => new Promise((resolve) => {
        const im = new Image();
        im.onload = im.onerror = () => {
          // Use decode() if available for fully-decoded readiness
          if (im.decode) {
            im.decode().then(resolve, resolve);
          } else {
            resolve();
          }
        };
        im.src = src;
      }))
    ).then(() => {
      if (!cancelled) setIconsReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  const cx = W / 2;
  const cy = H / 2; // centered
  const minDim = Math.min(W, H);
  const isCompact = minDim < 820;
  // All labels now sit above/below their icons (square-friendly), so the binding
  // constraint is vertical room for the top icon + its (sometimes tall) label.
  const verticalBudget = (H / 2) - 132; // room for top icon-half + label above it
  const horizontalBudget = (W / 2) - 132; // room for side-icon labels centered above
  const desiredOrbit = minDim * 0.335;
  const orbitR = Math.max(
    minDim * 0.26,
    Math.min(desiredOrbit, verticalBudget, horizontalBudget)
  );
  const hexR = orbitR * 0.56;
  const iconSize = isCompact ? minDim * 0.13 : Math.min(minDim * 0.125, orbitR * 0.38);

  const hexD = hexPath(cx, cy, hexR);

  const steps = window.STEPS;

  // Stage timing offsets (seconds)
  const T = {
    paper: 0,
    hex: 0.15,
    center: 1.0,
    rays: 1.7,
    icons: 2.3,
    labels: 2.95,
  };

  const dimmed = selectedId !== null || eyeOpen;
  // For the centerpiece, eyeOpen lifts opacity & scale rather than dimming.
  const eyeFocused = !!eyeOpen;

  return (
    <div
      className="orbit-root"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: stage === "stage1" ? "none" : "auto",
      }}
    >
      {/* SVG layer for hexagon + radial lines */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="wobble-strong" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Hexagon outline — self-draws via stroke-dasharray */}
        <M.path
          d={hexD}
          fill="none"
          stroke="var(--navy)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#wobble-strong)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: eyeOpen ? 0 : dimmed ? 0.25 : 0.7,
          }}
          transition={{
            pathLength: { delay: T.hex, duration: 0.85, ease: [0.16, 1, 0.3, 1] },
            opacity: eyeOpen
              ? { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
              : dimmed
              ? { duration: 0.6 }
              : { delay: T.hex, duration: 1.6, ease: [0.16, 1, 0.3, 1] },
          }}
        />

        {/* Inner sympathetic hexagon — burnt orange, fainter, slightly smaller */}
        <M.path
          d={hexPath(cx, cy, hexR * 0.78)}
          fill="none"
          stroke="var(--orange)"
          strokeWidth="0.9"
          strokeLinejoin="round"
          filter="url(#wobble-strong)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: eyeOpen ? 0 : dimmed ? 0.12 : 0.32,
          }}
          transition={{
            pathLength: { delay: T.hex + 0.2, duration: 0.85, ease: [0.16, 1, 0.3, 1] },
            opacity: eyeOpen
              ? { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
              : dimmed
              ? { duration: 0.6 }
              : { delay: T.hex + 0.3, duration: 1.6, ease: [0.16, 1, 0.3, 1] },
          }}
        />

        {/* Radial connectors — sky blue, straight from hex vertex outward to icon edge along the same radial */}
        {steps.map((s, i) => {
          const angleDeg = -90 + i * 60;
          const a = (angleDeg * Math.PI) / 180;
          const cosA = Math.cos(a);
          const sinA = Math.sin(a);
          const x1 = cx + hexR * cosA;
          const y1 = cy + hexR * sinA;
          const x2 = cx + (orbitR - iconSize * 0.55) * cosA;
          const y2 = cy + (orbitR - iconSize * 0.55) * sinA;
          return (
            <M.line
              key={`ray-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--sky-navy)"
              strokeWidth="1.1"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity:
                  dimmed && selectedId !== s.id
                    ? 0.08
                    : dimmed
                    ? 0.46
                    : 0.48,
              }}
              transition={{
                pathLength: {
                  delay: T.rays + i * 0.07,
                  duration: 0.48,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: dimmed
                  ? { duration: 0.6 }
                  : { delay: T.rays + i * 0.07, duration: 0.45 },
              }}
            />
          );
        })}
      </svg>

      {/* Central hexagon centerpiece — interactive */}
      <CenterEye
        cx={cx}
        cy={cy}
        hexR={hexR}
        dimmed={selectedId !== null}
        eyeFocused={eyeFocused}
        delay={T.center}
        onClick={onEyeClick}
        onBack={onEyeBack}
        onDoubleClick={onEyeDoubleClick}
        stage={stage}
      />

      {/* Icons */}
      {steps.map((s, i) => {
        const p = iconPos(cx, cy, orbitR, i);
        const isSelected = selectedId === s.id;
        const isOther = dimmed && !isSelected;

        return (
          <IconNode
            key={s.id}
            step={s}
            x={p.x}
            y={p.y}
            size={iconSize}
            isSelected={isSelected}
            isOther={isOther}
            stage={stage}
            iconDelay={T.icons + i * 0.1}
            onClick={() => onSelect(s.id)}
          />
        );
      })}

      {/* Labels — grouped by side */}
      <Labels
        steps={steps}
        cx={cx}
        cy={cy}
        orbitR={orbitR}
        iconSize={iconSize}
        W={W}
        H={H}
        dimmed={dimmed}
        selectedId={selectedId}
        eyeOpen={eyeOpen}
        stage={stage}
        labelDelayBase={T.labels}
      />

      {/* Particle motes */}
      {stage !== "stage1" && <Particles count={6} />}
    </div>
  );
}

function IconNode({
  step,
  x,
  y,
  size,
  isSelected,
  isOther,
  stage,
  iconDelay,
  onClick,
}) {
  // Per-icon micro-motion: breathing, plus step-specific motion (flame flicker, wave rock)
  const phase = React.useMemo(() => Math.random() * 3, []);

  // Step-specific micro-motion
  const microAnim = React.useMemo(() => {
    if (step.id === 1) {
      // flame flicker
      return {
        animate: { scale: [1, 1.025, 0.99, 1.015, 1], rotate: [0, 0.4, -0.3, 0.2, 0] },
        transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (step.id === 4) {
      // wave gentle rock
      return {
        animate: { rotate: [-1.6, 1.6, -1.6] },
        transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (step.id === 2) {
      // mandala very slow rotate
      return {
        animate: { rotate: [0, 360] },
        transition: { duration: 120, repeat: Infinity, ease: "linear" },
      };
    }
    // generic breathing
    return {
      animate: { scale: [0.99, 1.01, 0.99] },
      transition: {
        duration: 3 + phase * 0.3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: phase,
      },
    };
  }, [step.id, phase]);

  return (
    <React.Fragment>
      {/* Icon */}
      <M.button
        type="button"
        onClick={onClick}
        aria-label={`Step ${step.numeral}: ${step.label}`}
        className="orbit-icon-btn"
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: stage === "stage2" ? "pointer" : "default",
          zIndex: isSelected ? 5 : 2,
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{
          opacity: isSelected ? 0.32 : isOther ? 0.18 : 1,
          scale: isSelected ? 1.45 : isOther ? 0.85 : 1,
        }}
        transition={{
          opacity:
            stage === "stage1"
              ? { delay: iconDelay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale:
            stage === "stage1"
              ? { delay: iconDelay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        }}
        whileHover={
          stage === "stage2" && !isSelected
            ? { scale: 1.06, transition: { duration: 0.3 } }
            : {}
        }
      >
        <M.div
          style={{ width: "100%", height: "100%" }}
          {...microAnim}
        >
          <img
            src={step.icon}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
              filter: "drop-shadow(0 1px 0 rgba(51,41,29,0.05))",
            }}
          />
        </M.div>
      </M.button>

    </React.Fragment>
  );
}

// Group label component — renders 1 or 2 labels in a stack with given alignment.
function Labels({ steps, cx, cy, orbitR, iconSize, W, H, dimmed, selectedId, eyeOpen, stage, labelDelayBase }) {
  const fontSize = "clamp(15px, 1.15vw, 19px)";
  const blockWidth = Math.min(340, W * 0.30);
  const opacityFor = (id) => {
    if (eyeOpen) return 0;
    if (selectedId === null) return 0.92;
    return selectedId === id ? 0 : 0;
  };

  // Step indices: 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
  const top = steps[0];
  const tr = steps[1];
  const br = steps[2];
  const bottom = steps[3];
  const bl = steps[4];
  const tl = steps[5];

  const iconHalf = iconSize / 2;
  // Tighter top/bottom: bring labels close to their icons
  const verticalGap = iconSize * 0.15;
  // Tighter sides: bring left/right labels in toward the icons
  const sideGap = iconSize * 0.25;

  // Top icon position: cy - orbitR. Top label sits ABOVE.
  const topIconY = cy - orbitR;
  const bottomIconY = cy + orbitR;

  // Right side: average y between tr (cy - orbitR*sin(60°)) and br (cy + orbitR*sin(60°)) = cy
  // X position: max x of tr/br (both same) + iconHalf + gap
  const rightIconX = cx + orbitR * Math.cos(Math.PI / 6); // cos(30°) = sin(60°)
  const leftIconX = cx - orbitR * Math.cos(Math.PI / 6);

  const baseTextStyle = {
    fontFamily: "'Tiempos Text', Georgia, serif",
    fontSize,
    lineHeight: 1.32,
    color: "var(--navy)",
    pointerEvents: "none",
    textWrap: "pretty",
  };

  const renderBlock = (step, i) => (
    <M.div
      key={step.id}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: opacityFor(step.id), y: 0 }}
      transition={
        stage === "stage1"
          ? { delay: labelDelayBase + i * 0.05, duration: 0.85, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0.5 }
      }
      style={{ marginBottom: 0 }}
    >
      <span
        style={{
          fontStyle: "italic",
          color: "var(--orange)",
          fontSize: "0.78em",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginRight: 8,
          opacity: 0.9,
        }}
      >
        {step.numeral}
      </span>
      <span>{step.label}</span>
    </M.div>
  );

  return (
    <React.Fragment>
      {/* TOP — Step 1, centered above icon */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: topIconY - iconHalf - verticalGap,
          transform: "translate(-50%, -100%)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(top, 0)}
      </div>

      {/* BOTTOM — Step 4, centered below icon */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: bottomIconY + iconHalf + verticalGap,
          transform: "translate(-50%, 0)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(bottom, 3)}
      </div>

      {/* RIGHT-TOP — Step 2: centered ABOVE its icon */}
      <div
        style={{
          position: "absolute",
          left: rightIconX,
          top: cy - orbitR / 2 - iconHalf - verticalGap,
          transform: "translate(-50%, -100%)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(tr, 1)}
      </div>

      {/* RIGHT-BOTTOM — Step 3: centered BELOW its icon (radiates outward) */}
      <div
        style={{
          position: "absolute",
          left: rightIconX,
          top: cy + orbitR / 2 + iconHalf + verticalGap,
          transform: "translate(-50%, 0)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(br, 2)}
      </div>

      {/* LEFT-TOP — Step 6: centered ABOVE its icon */}
      <div
        style={{
          position: "absolute",
          left: leftIconX,
          top: cy - orbitR / 2 - iconHalf - verticalGap,
          transform: "translate(-50%, -100%)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(tl, 5)}
      </div>

      {/* LEFT-BOTTOM — Step 5: centered BELOW its icon (radiates outward) */}
      <div
        style={{
          position: "absolute",
          left: leftIconX,
          top: cy + orbitR / 2 + iconHalf + verticalGap,
          transform: "translate(-50%, 0)",
          width: blockWidth,
          textAlign: "center",
          ...baseTextStyle,
        }}
      >
        {renderBlock(bl, 4)}
      </div>
    </React.Fragment>
  );
}

// Single label block, center-aligned, with numeral + label text
function StepLabelBlock({ step, opacity, delay, stage }) {
  return (
    <M.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity, y: 0 }}
      transition={
        stage === "stage1"
          ? { delay, duration: 1.0, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0.5 }
      }
      style={{
        marginBottom: 10,
        lineHeight: 1.32,
      }}
    >
      <div style={{ fontStyle: "italic", color: "var(--orange)", fontSize: "0.85em", letterSpacing: "0.05em" }}>
        {step.numeral}
      </div>
      <div>{step.label}</div>
    </M.div>
  );
}

Object.assign(window, { StepLabelBlock });

function Particles({ count }) {
  const motes = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      drift: 8 + Math.random() * 14,
      duration: 18 + Math.random() * 14,
      delay: Math.random() * 8,
      size: 2 + Math.random() * 2.5,
    }));
  }, [count]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {motes.map((m) => (
        <M.div
          key={m.id}
          style={{
            position: "absolute",
            left: `${m.startX}%`,
            top: `${m.startY}%`,
            width: m.size,
            height: m.size,
            borderRadius: "50%",
            background: "var(--sky)",
            opacity: 0.18,
          }}
          animate={{
            x: [0, m.drift * 6, 0],
            y: [0, -m.drift * 4, 0],
            opacity: [0.05, 0.22, 0.05],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.delay,
          }}
        />
      ))}
    </div>
  );
}

Object.assign(window, { Orbit });

// ────────────────────────────────────────────────────────────
// CenterEye — interactive central hexagon (eye-of-awareness)
// ────────────────────────────────────────────────────────────
function CenterEye({ cx, cy, hexR, dimmed, eyeFocused, delay, onClick, onBack, onDoubleClick, stage }) {
  const [hover, setHover] = React.useState(false);
  const [pointerStep, setPointerStep] = React.useState(-1); // -1 none, 0/1/2
  const lastClickRef = React.useRef(0);
  const pendingClickTimerRef = React.useRef(null);

  // When eyeFocused becomes true, run the 3-pointer sequence.
  React.useEffect(() => {
    if (!eyeFocused) {
      setPointerStep(-1);
      return;
    }
    // Pointer 1 starts after the centerpiece settles in
    const t1 = setTimeout(() => setPointerStep(0), 1400); // "Are you aware?"
    const t2 = setTimeout(() => setPointerStep(1), 1400 + 6000); // hold ~4s + 2s fade
    const t3 = setTimeout(() => setPointerStep(2), 1400 + 12000); // → "Be your Beingness"
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [eyeFocused]);

  // Outside-click & escape are handled by App / overlay click area below.
  const size = hexR * 1.9;
  const halfSize = size / 2;

  // Image scale & filter
  const scale = eyeFocused ? 1.4 : hover ? 1.04 : 1;
  const brightness = eyeFocused ? 1.08 : hover ? 1.05 : 1;

  // Show "Are you aware?" only when hovering in resting state (and not focused)
  const showHoverHint = false;

  const pointers = [
    { text: "Are you aware?", hold: 4 },
    { text: "Rest as Awareness", hold: 4 },
    { text: "Be your Beingness", hold: null }, // never fade out
  ];

  return (
    <React.Fragment>
      {/* Click-outside catcher when eyeFocused — sits below the eye, above icons */}
      {eyeFocused && (
        <div
          onClick={onBack}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            cursor: "default",
          }}
        />
      )}

      {/* Eye image (clickable button) */}
      <M.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const now = Date.now();
          const gap = now - lastClickRef.current;
          lastClickRef.current = now;
          // Double-tap (within 350ms) → reset to launch
          if (gap < 350 && gap > 0) {
            if (pendingClickTimerRef.current) {
              clearTimeout(pendingClickTimerRef.current);
              pendingClickTimerRef.current = null;
            }
            onDoubleClick && onDoubleClick();
            return;
          }
          // Defer the single-click action briefly so a second click can cancel it
          if (pendingClickTimerRef.current) clearTimeout(pendingClickTimerRef.current);
          pendingClickTimerRef.current = setTimeout(() => {
            pendingClickTimerRef.current = null;
            if (eyeFocused) return;
            onClick && onClick();
          }, 360);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="The eye of awareness"
        style={{
          position: "absolute",
          left: cx - halfSize,
          top: cy - halfSize,
          width: size,
          height: size,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: stage === "stage2" && !dimmed ? "pointer" : "default",
          zIndex: eyeFocused ? 6 : 1,
          pointerEvents: stage === "stage2" && !dimmed ? "auto" : "none",
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: dimmed ? 0.1 : 0.55,
          scale,
          filter: `brightness(${brightness})`,
        }}
        transition={{
          opacity: dimmed
            ? { duration: 0.6 }
            : { delay, duration: 1.05, ease: [0.16, 1, 0.3, 1] },
          scale: eyeFocused
            ? { duration: 2.0, ease: [0.16, 1, 0.3, 1] }
            : hover
            ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            : { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          filter: { duration: 0.8 },
        }}
      >
        <img
          src="assets/hexagon-center.png"
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </M.button>

      {/* Hover hint — "Are you aware?" sits below the centerpiece */}
      <AnimatePresence>
        {showHoverHint && (
          <M.div
            key="hover-hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: cy + halfSize - hexR * 0.18,
              textAlign: "center",
              fontFamily: "'Tiempos Text', Georgia, serif",
              fontStyle: "italic",
              fontSize: 19,
              color: "var(--navy)",
              opacity: 0.78,
              letterSpacing: "0.005em",
              pointerEvents: "none",
              zIndex: 6,
            }}
          >
            Are you aware?
          </M.div>
        )}
      </AnimatePresence>

      {/* Pointer sequence — only when eyeFocused */}
      <AnimatePresence>
        {eyeFocused &&
          pointers.map((p, i) =>
            pointerStep === i ? (
              <M.div
                key={`p-${i}`}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={i === 2 ? undefined : { opacity: 0, y: -3 }}
                transition={{
                  opacity: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                  y: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: cy + halfSize * 1.4 + hexR * 0.18,
                  textAlign: "center",
                  fontFamily: "'Tiempos Text', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(22px, 1.7vw, 28px)",
                  color: "var(--navy)",
                  letterSpacing: "0.01em",
                  pointerEvents: "none",
                  zIndex: 7,
                }}
              >
                {p.text}
              </M.div>
            ) : null
          )}
      </AnimatePresence>

      {/* Return link — appears after 3rd pointer settles */}
      <AnimatePresence>
        {eyeFocused && pointerStep >= 2 && (
          <M.button
            key="eye-back"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBack && onBack();
            }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ delay: 1.0, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: 36,
              top: 30,
              zIndex: 8,
              background: "transparent",
              border: "none",
              color: "var(--navy)",
              fontFamily: "'Tiempos Text', Georgia, serif",
              fontStyle: "italic",
              fontSize: 16,
              cursor: "pointer",
              opacity: 0.75,
              letterSpacing: "0.01em",
              padding: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
          >
            ← return
          </M.button>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
}

Object.assign(window, { CenterEye });
