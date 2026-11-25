import { useMemo, useState } from 'react'
import { Search, Check, X, MapPin, Navigation, LocateFixed } from 'lucide-react'
import { DONATE, VERDICTS } from '../data/donate'
import { SITES } from '../data/sites'
import { distMiles, directionsUrl, locate } from '../lib/geo'

const GLYPH = { yes: <Check size={15} aria-hidden="true" />, no: <X size={15} aria-hidden="true" />, maybe: <b aria-hidden="true">?</b> }

export default function Donate({ onMap }) {
  const [q, setQ] = useState('')
  const [v, setV] = useState('all')
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return DONATE.filter(d => (v === 'all' || d.verdict === v) && (!t || (d.name + ' ' + d.keywords).toLowerCase().includes(t)))
  }, [q, v])

  // Places that take donations: reuse shops, textile bins and repair events.
  const places = useMemo(() => SITES
    .filter(s => s.layer === 'textile' || s.layer === 'repair')
    .map(s => ({ ...s, miles: user ? distMiles(user, [s.lat, s.lng]) : null }))
    .sort((a, b) => user ? a.miles - b.miles : (b.borough === 'Brooklyn') - (a.borough === 'Brooklyn'))
    .slice(0, 6), [user])

  return (
    <section>
      <h1 className="page-h">Can I donate it?</h1>
      <p className="muted">Type what you have. We’ll tell you if donation centers usually take it, and where to go.</p>

      <div className="dsearch">
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="A couch? Pillows? A mattress?" aria-label="Search donation items" />
      </div>
      <div className="cats">
        {[['all', 'All'], ['yes', 'Usually accepted'], ['maybe', 'Ask first'], ['no', 'Usually not accepted']].map(([k, label]) => (
          <button key={k} className={'chip' + (v === k ? ' on' : '')} onClick={() => setV(k)}>{label}</button>
        ))}
      </div>

      <div className="dgrid">
        {list.map(d => (
          <div key={d.id} className="vcard" style={{ '--c': VERDICTS[d.verdict].color }}>
            <span className="vbadge">{GLYPH[d.verdict]}{VERDICTS[d.verdict].label}</span>
            <b>{d.name}</b>
            <span className="muted small">{d.note}</span>
          </div>
        ))}
      </div>
      {!list.length && <p className="muted">Nothing matches. Policies differ by organization, so call ahead for unusual items.</p>}

      <h2 className="h2">Where to donate</h2>
      <div className="bar2">
        <button className="btn" onClick={() => { setMsg('Finding you…'); locate(p => { setUser(p); setMsg('') }, setMsg) }}><LocateFixed size={16} aria-hidden="true" />Sort by distance</button>
        <button className="btn primary" onClick={() => onMap('textile')}><MapPin size={16} aria-hidden="true" />See them on the map</button>
      </div>
      {msg && <p className="muted small">{msg}</p>}
      <div className="dgrid">
        {places.map(s => (
          <div key={s.id} className="vcard" style={{ '--c': '#C42675' }}>
            <b>{s.name}</b>
            <span className="muted small">{s.nta ? `${s.nta}, ${s.borough}` : `${s.borough} ${s.cd}`}{s.miles != null ? ` · ${s.miles.toFixed(1)} mi` : ''} · {s.hours}</span>
            <span className="small">{s.accepts}</span>
            <a className="btn" href={directionsUrl(s)} target="_blank" rel="noreferrer"><Navigation size={14} aria-hidden="true" />Directions</a>
          </div>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 18 }}>These are general guidelines. Every organization sets its own rules, so check before you go.</p>
    </section>
  )
}