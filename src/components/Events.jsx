import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Navigation, ExternalLink, Clock, MapPin } from 'lucide-react'
import { SITES } from '../data/sites'
import { LAYERS } from '../data/layers'
import ONE_OFF from '../data/events.json'
import { directionsUrl } from '../lib/geo'

// The Events calendar. It has two kinds of events:
//
// 1. REPEATING drop-offs, worked out from the map's sites. Any site with a `schedule`
//    (made by scripts/schedule.mjs from DSNY's food scrap data) shows up on its days.
//    Nothing to maintain here: `npm run data` keeps them current.
//
// 2. ONE-TIME events (a SAFE disposal day, an e-waste event, a swap) written in
//    src/data/events.json. Each one looks like this (JSON can't have comments, so the example is here):
//      {
//        "name": "SAFE Disposal Event",
//        "date": "2026-12-06",           <- year-month-day
//        "start": "10:00", "end": "16:00", <- 24-hour time; leave out if unknown
//        "layer": "safe",                <- a category from layers.js (sets the color)
//        "address": "...", "borough": "Brooklyn", "nta": "Park Slope",
//        "lat": 40.67, "lng": -73.98,    <- optional, used for directions
//        "accepts": "...", "website": "https://..."
//      }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A date as "2026-11-25", so dates can be compared as plain text.
const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// "13:30" -> "1:30 PM"
const ampm = t => {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`
}

// Is a month (1-12) inside a season like April-October? Also works for seasons over New Year (Nov-Mar).
const inSeason = (month, s) => !s.from || (s.from <= s.to ? month >= s.from && month <= s.to : month >= s.from || month <= s.to)

// Does a repeating schedule happen on this date?
function happensOn(s, date) {
  if (!s.days.includes(date.getDay())) return false
  if (!inSeason(date.getMonth() + 1, s)) return false
  if (s.nth && Math.ceil(date.getDate() / 7) !== s.nth) return false   // e.g. only the 3rd Saturday
  return true
}

const REPEATING = SITES.filter(s => s.schedule)

// Every event on one date, earliest first.
function eventsOn(date) {
  const k = key(date)
  const repeating = REPEATING.filter(s => happensOn(s.schedule, date)).map(s => ({
    ...s, id: `${s.id}-${k}`, start: s.schedule.start, end: s.schedule.end, repeats: true,
  }))
  const once = ONE_OFF.filter(e => e.date === k).map((e, i) => ({ id: `event-${k}-${i}`, layer: 'repair', ...e }))
  return [...repeating, ...once].sort((a, b) => (a.start || '99').localeCompare(b.start || '99'))
}

export default function Events() {
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))   // first day of the month shown
  const [day, setDay] = useState(key(today))   // the date picked
  const [borough, setBorough] = useState('')
  const [nta, setNta] = useState('')

  const keep = e => (!borough || e.borough === borough) && (!nta || e.nta === nta)

  // Dropdown choices come from the events themselves. Neighborhoods only list the chosen borough's.
  const all = useMemo(() => [...REPEATING, ...ONE_OFF], [])
  const boroughs = [...new Set(all.map(e => e.borough).filter(Boolean))].sort()
  const ntas = [...new Set(all.filter(e => !borough || e.borough === borough).map(e => e.nta).filter(Boolean))].sort()

  // The squares of the month grid: blanks before the 1st, then one per day.
  const cells = useMemo(() => {
    const first = month.getDay()
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [
      ...Array(first).fill(null),
      ...Array.from({ length: count }, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1)
        return { date, k: key(date), n: eventsOn(date).filter(keep).length }
      }),
    ]
  }, [month, borough, nta])   // eslint-disable-line react-hooks/exhaustive-deps

  const picked = new Date(day + 'T00:00')
  const list = eventsOn(picked).filter(keep)
  const step = n => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <section>
      <h1 className="page-h">Waste Drop-off Events</h1>
      <p className="muted">Food scrap drop-offs and other collection events in NYC. Pick a day to see what’s going on near you!.</p>

      <div className="bar2">
        <select className="minput" value={borough} onChange={e => { setBorough(e.target.value); setNta('') }} aria-label="Borough">
          <option value="">All boroughs</option>
          {boroughs.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="minput" value={nta} onChange={e => setNta(e.target.value)} aria-label="Neighborhood">
          <option value="">All neighborhoods</option>
          {ntas.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      {/* Two columns: the calendar stays put on the left, the day's events scroll on the right. */}
      <div className="cal-layout">
      <div className="cal">
        <div className="cal-head">
          <button className="btn" onClick={() => step(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn" onClick={() => step(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        <div className="cal-grid">
          {WEEKDAYS.map(w => <span key={w} className="cal-wd">{w}</span>)}
          {cells.map((c, i) => !c ? <span key={i} /> : (
            <button key={c.k} onClick={() => setDay(c.k)}
              className={'cal-day' + (c.k === day ? ' on' : '') + (c.k === key(today) ? ' today' : '') + (c.k < key(today) ? ' past' : '')}
              aria-label={`${c.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}: ${c.n} event${c.n === 1 ? '' : 's'}`}>
              <span>{c.date.getDate()}</span>
              <span className={'cal-dot' + (c.n > 0 ? ' has' : '')} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="cal-list">
      <h2 className="cal-title">{picked.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
      {!list.length && <p className="muted">Nothing on this day{borough || nta ? ' here. Try another neighborhood or day.' : '.'}</p>}
      <div className="cal-cards">
        {list.map(e => (
          <div key={e.id} className="vcard" style={{ '--c': LAYERS[e.layer]?.color || 'var(--accent)' }}>
            <span className="vbadge"><Clock size={14} aria-hidden="true" />{e.start ? `${ampm(e.start)} – ${ampm(e.end)}` : 'See hours'}</span>
            <b>{e.name}</b>
            <span className="muted small"><MapPin size={13} aria-hidden="true" /> {e.nta ? `${e.nta}, ${e.borough}` : e.borough}</span>
            {e.address && <span className="small">{e.address}</span>}
            {!e.start && e.hours && <span className="small">{e.hours}</span>}
            {e.accepts && <span className="small">{e.accepts}</span>}
            <span className="muted small">{LAYERS[e.layer]?.name}{e.repeats ? (e.schedule.nth ? ' · repeats monthly' : ' · repeats weekly') : ''}</span>
            <div className="actions">
              {(e.lat || e.address) && (
                <a className="btn" href={e.lat ? directionsUrl(e) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`} target="_blank" rel="noreferrer">
                  <Navigation size={14} aria-hidden="true" />Directions
                </a>
              )}
              {e.website && <a className="btn" href={e.website} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />Website</a>}
            </div>
          </div>
        ))}
      </div>
      </div>
      </div>
    </section>
  )
}
