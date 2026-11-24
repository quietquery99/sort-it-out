// The animated NYC skyline. Everything is drawn with SVG; colors come from CSS variables,
// and the "night-layer" / "day-layer" groups fade in and out when the theme changes.
const W = 1200, H = 360

// Tiny deterministic random generator so the skyline looks the same on every load.
function rng(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

// A row of buildings filling x0..x1 with random widths and heights.
function row(seed, x0, x1, minW, maxW, minH, maxH) {
  const r = rng(seed), out = []
  let x = x0, i = 0
  while (x < x1) {
    const w = Math.round(minW + r() * (maxW - minW))
    const h = Math.round(minH + r() * (maxH - minH))
    out.push({ x, w: Math.min(w, x1 - x), h, i: i++ })
    x += w
  }
  return out
}
const FAR = row(3, 0, W, 34, 62, 70, 170)
const MID = row(7, 600, W, 40, 72, 110, 220)
const NEAR = row(11, 0, W, 44, 84, 26, 58)
const ESB = { x: 842, w: 56, h: 210, i: 3 }   // Empire State-style tower base

const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = rng(100 + i)
  return { x: Math.round(r() * 1200), y: Math.round(r() * 300), r: +(0.8 + r() * 1.5).toFixed(1), d: (r() * 4).toFixed(1) }
})
const CLOUDS = [
  { y: 90, s: 1, dur: 90, delay: -20 }, { y: 170, s: 0.7, dur: 120, delay: -70 },
  { y: 55, s: 0.55, dur: 150, delay: -110 }, { y: 240, s: 0.9, dur: 100, delay: -45 },
]

// Brooklyn Bridge: towers at x=150 and x=420, deck at y=300, hangers computed along the curve.
const HANGERS = Array.from({ length: 17 }, (_, k) => {
  const t = (k + 1) / 18
  return { x: +(150 + 270 * t).toFixed(1), y: +(212 * (1 - t) ** 2 + 680 * (1 - t) * t + 212 * t * t).toFixed(1) }
})

// Lit windows for one building (about 40% stay dark; some twinkle).
function Windows({ b, top }) {
  const cols = Math.floor((b.w - 10) / 11), rows = Math.floor((b.h - 12) / 15), out = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = (b.i * 7 + r * 5 + c * 3) % 5
      if (k < 2) continue
      out.push(
        <rect key={`${r}-${c}`} className={'win' + (k === 4 ? ' tw' : '')} x={b.x + 6 + c * 11} y={top + 8 + r * 15}
          width="5" height="7" style={k === 4 ? { animationDelay: `${(r + c) % 5}s` } : undefined} />
      )
    }
  }
  return <>{out}</>
}

// Classic NYC rooftop water tank.
function Tank({ x, y, cls }) {
  return (
    <g className={cls}>
      <path d={`M${x + 2} ${y} V${y - 8} M${x + 12} ${y} V${y - 8}`} stroke="currentColor" fill="none" />
      <rect x={x} y={y - 22} width="14" height="14" />
      <path d={`M${x - 2} ${y - 22} L${x + 7} ${y - 29} L${x + 16} ${y - 22} Z`} />
    </g>
  )
}

export default function Scene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="sky sky-night" />
      <div className="sky sky-day" />

      <svg className="celestial" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice">
        <g className="night-layer">
          {STARS.map((s, i) => <circle key={i} className="star" cx={s.x} cy={s.y} r={s.r} style={{ animationDelay: `${s.d}s` }} />)}
          <circle cx="1000" cy="110" r="74" fill="#f4f1de" opacity=".07" />
          <circle cx="1000" cy="110" r="50" fill="#f4f1de" opacity=".12" />
          <circle cx="1000" cy="110" r="32" fill="#f4f1de" />
          <circle cx="990" cy="101" r="6" fill="#d8d4bb" /><circle cx="1011" cy="120" r="4.5" fill="#d8d4bb" /><circle cx="1004" cy="96" r="3" fill="#d8d4bb" />
        </g>
        <g className="day-layer">
          <circle cx="1000" cy="110" r="84" fill="#fff3b0" opacity=".25" />
          <circle cx="1000" cy="110" r="58" fill="#ffe27a" opacity=".4" />
          <g className="rays">
            {Array.from({ length: 12 }, (_, i) => <rect key={i} x="998" y="38" width="4" height="22" rx="2" fill="#ffd75e" transform={`rotate(${i * 30} 1000 110)`} />)}
          </g>
          <circle cx="1000" cy="110" r="36" fill="#ffc83d" />
          {CLOUDS.map((c, i) => (
            <g key={i} transform={`translate(0 ${c.y})`}>
              <g className="cloud" style={{ animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}>
                <g transform={`scale(${c.s})`}>
                  <ellipse cx="0" cy="0" rx="46" ry="17" /><ellipse cx="-28" cy="7" rx="32" ry="13" /><ellipse cx="30" cy="6" rx="36" ry="14" />
                </g>
              </g>
            </g>
          ))}
        </g>
      </svg>

      <svg className="city" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        {/* far layer */}
        {FAR.map(b => <rect key={b.i} className="far" x={b.x} y={H - b.h} width={b.w} height={b.h} />)}

        {/* mid layer: Brooklyn Bridge on the left, towers on the right */}
        <g className="mid" style={{ color: 'var(--mid)' }}>
          <rect x="137" y="206" width="26" height="154" /><rect x="407" y="206" width="26" height="154" />
          <rect x="133" y="200" width="34" height="8" /><rect x="403" y="200" width="34" height="8" />
          <rect x="0" y="300" width="600" height="5" />
          <path className="cable" d="M0 262 L150 212 Q285 340 420 212 L600 262" />
          {HANGERS.map((h, i) => <line key={i} className="hanger" x1={h.x} y1={h.y} x2={h.x} y2="300" />)}
          {MID.map(b => <rect key={b.i} x={b.x} y={H - b.h} width={b.w} height={b.h} />)}
                    {/* Empire State-style tower with stepped top and spire */}
          <rect x={ESB.x} y={H - ESB.h} width={ESB.w} height={ESB.h} />
          <rect x={ESB.x + 10} y={H - ESB.h - 30} width={ESB.w - 20} height="30" />
          <rect x={ESB.x + 18} y={H - ESB.h - 52} width={ESB.w - 36} height="22" />
          <rect x={ESB.x + 24} y={H - ESB.h - 66} width={ESB.w - 48} height="14" />
          <rect x={ESB.x + ESB.w / 2 - 1} y={H - ESB.h - 104} width="2" height="38" />
          <Tank x={MID[2].x + 12} y={H - MID[2].h} />
          <Tank x={MID[6].x + 14} y={H - MID[6].h} />
        </g>

        {/* lit windows (visible at night only) */}
        <g className="night-layer">
          {MID.map(b => <Windows key={b.i} b={b} top={H - b.h} />)}
          <Windows b={ESB} top={H - ESB.h} />
        </g>

        {/* near layer: low rooftops in front */}
        <g className="near" style={{ color: 'var(--near)' }}>
          {NEAR.map(b => <rect key={b.i} x={b.x} y={H - b.h} width={b.w} height={b.h} />)}
          <Tank x={NEAR[3].x + 14} y={H - NEAR[3].h} />
        </g>
        <g className="night-layer">
          {NEAR.map(b => <Windows key={b.i} b={b} top={H - b.h} />)}
        </g>
      </svg>
    </div>
  )
}