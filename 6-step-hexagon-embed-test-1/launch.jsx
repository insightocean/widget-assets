// Stage 0 — Launch screen.
// A small cycling hexagon icon sits at the TOP VERTEX of the eventual hexagon
// (the same starting point of the hexagon line draw). On click it fades out and
// the original Stage 1 self-drawing hexagon animation begins from that same point.

const M_l = window.motion;
const AP_l = window.AnimatePresence;

const LAUNCH_ICONS = [
  "assets/Hexagon Motif - Cloud Sun 1.png",
  "assets/Hexagon Motif - Sun 1.png",
  "assets/Hexagon Motif - Mountain Sun 1.png",
  "assets/Hexagon Motif - Wave 1.png",
];

const HOLD_MS = 6000;
const FADE_MS = 1100;

function Launch({ onLaunch, dimensions }) {
  const { w: W, h: H } = dimensions;
  const cx = W / 2;
  const cy = H / 2;
  const minDim = Math.min(W, H);

  // Match Orbit's hex math so the icon sits exactly at the eventual top vertex.
  const verticalBudget = (H / 2) - 110;
  const horizontalBudget = (W / 2) - 280;
  const orbitR = Math.max(
    minDim * 0.26,
    Math.min(minDim * 0.32, verticalBudget, horizontalBudget * 1.3)
  );
  const hexR = orbitR * 0.58;

  // Launch icon: small enough to read as a "seed" at the vertex (not the centerpiece)
  const iconSize = Math.min(150, minDim * 0.16);

  // Center of the hexagon — same position the centerpiece eventually occupies
  const vertexX = cx;
  const vertexY = cy;

  const [activeIdx, setActiveIdx] = React.useState(0);
  const [hover, setHover] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);

  // Cycle through icons
  React.useEffect(() => {
    if (clicked) return;
    const t = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % LAUNCH_ICONS.length);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [activeIdx, clicked]);

  // Preload all four PNGs so crossfades have no decode flicker
  React.useEffect(() => {
    LAUNCH_ICONS.forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, []);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    // Hand off IMMEDIATELY so stage1 starts drawing the hexagon while the
    // launch icon is still fading out — full crossover
    onLaunch && onLaunch();
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="launch-wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Cycling icon — sits at the top vertex of the eventual hexagon */}
      <M_l.div
        onClick={handleClick}
        onMouseEnter={() => !clicked && setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !clicked) {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Begin: Six Steps to Liberation"
        style={{
          position: "absolute",
          left: vertexX - iconSize / 2,
          top: vertexY - iconSize / 2,
          width: iconSize,
          height: iconSize,
          cursor: clicked ? "default" : "pointer",
          outline: "none",
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: clicked ? 0 : 1,
          scale: clicked ? 0.95 : hover ? 1.04 : 1,
        }}
        transition={{
          opacity: { duration: clicked ? 1.0 : 1.2, ease: "easeInOut" },
          scale: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        {/* All four icons rendered simultaneously — only opacity changes. This
            avoids any per-cycle decode/wipe; PNGs are decoded once on mount. */}
        {LAUNCH_ICONS.map((src, i) => (
          <M_l.img
            key={`icon-${i}`}
            src={src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
            initial={{ opacity: i === 0 ? 1 : 0 }}
            animate={{ opacity: i === activeIdx ? 1 : 0 }}
            transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
          />
        ))}

        {/* Hover hex outline — sits ~10px outside the icon, hand-drawn wobble */}
        <AP_l>
          {hover && !clicked && (
            <M_l.svg
              key="hover-outline"
              width={iconSize + 28}
              height={iconSize + 28}
              viewBox={`0 0 ${iconSize + 28} ${iconSize + 28}`}
              style={{
                position: "absolute",
                left: -14,
                top: -14,
                pointerEvents: "none",
                overflow: "visible",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <path
                d={(() => {
                  const c = (iconSize + 28) / 2;
                  const r = iconSize * 0.55;
                  let d = "";
                  for (let i = 0; i < 6; i++) {
                    const a = ((-90 + i * 60) * Math.PI) / 180;
                    d += (i === 0 ? "M" : "L") +
                      (c + r * Math.cos(a)).toFixed(2) +
                      "," +
                      (c + r * Math.sin(a)).toFixed(2) +
                      " ";
                  }
                  return d + "Z";
                })()}
                fill="none"
                stroke="var(--navy)"
                strokeWidth="1.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#launch-wobble)"
              />
            </M_l.svg>
          )}
        </AP_l>
      </M_l.div>

      {/* Title — italic Tiempos, sits just below the icon. On click, fades upward
          and out (the persistent footer caption takes over independently). */}
      <M_l.div
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: clicked ? 0 : hover ? 1 : 0.92,
          y: clicked ? -28 : hover ? -2 : 0,
        }}
        transition={{
          opacity: { delay: clicked ? 0 : 0.4, duration: clicked ? 1.0 : 1.0 },
          y: { duration: clicked ? 1.4 : 0.6, ease: [0.16, 1, 0.3, 1] },
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: vertexY + iconSize / 2 + 28,
          textAlign: "center",
          fontFamily: "'Tiempos Text', Georgia, serif",
          fontStyle: "italic",
          fontSize: 30,
          color: "#33291D",
          pointerEvents: "none",
          fontWeight: 400,
          textWrap: "pretty",
        }}
      >
        Six Steps to Liberation
      </M_l.div>
    </div>
  );
}

Object.assign(window, { Launch });
