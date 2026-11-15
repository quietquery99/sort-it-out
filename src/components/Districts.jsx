import { DISTRICTS, COMPLAINT_TYPES } from '../data/districts'

const COLORS = ['#C2410C', '#7C3AED', '#0E8F8F']

// One horizontal bar per district.
function Bars({ getValue, max, color, suffix = '' }) {
  return DISTRICTS.map(d => (
    <div className="row" key={d.id}>
      <span>{d.short}</span>
      <div className="track"><div style={{ width: `${(getValue(d) / max) * 100}%`, background: color }} /></div>
      <b>{getValue(d)}{suffix}</b>
    </div>
  ))
}

export default function Districts() {
  return (
    <section>
      <h1 style={{ fontSize: 36 }}>District &amp; equity explorer</h1>
      <p className="warn">Illustrative placeholder values. Replace with DSNY collection and diversion tables and NYC 311 data before presenting as fact.</p>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Diversion rate</h3>
          <p className="muted">Citywide diversion is about 20% of a potential 75% (DSNY 2023). Bars are scaled to 75%.</p>
          <Bars getValue={d => d.diversion} max={75} color="#23904F" suffix="%" />
        </div>
        <div className="card">
          <h3>Refuse per household (lbs/week)</h3>
          <Bars getValue={d => d.refuse} max={50} color="#7A4A27" />
        </div>
        <div className="card">
          <h3>311 sanitation complaints</h3>
          <p className="muted">{COMPLAINT_TYPES.map((t, i) => (
            <span key={t}><span className="dot" style={{ background: COLORS[i], marginRight: 4 }} />{t}{i < 2 ? ' · ' : ''}</span>
          ))}</p>
          {DISTRICTS.map(d => (
            <div className="row" key={d.id}>
              <span>{d.short}</span>
              <div className="track">{d.complaints.map((c, i) => <div key={i} style={{ width: `${c}%`, background: COLORS[i] }} />)}</div>
              <span />
            </div>
          ))}
        </div>
        <div className="card">
          <h3>What frontline workers flag</h3>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>Lithium-ion batteries in trucks cause compaction fires.</li>
            <li>Bagged liquids and sharps injure crews at the hopper.</li>
            <li>Overflowing baskets cluster near transit and commercial strips.</li>
            <li>Contamination was higher in 2023 than in 2013.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}