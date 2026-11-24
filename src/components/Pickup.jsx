import { useState } from 'react'
import { Bell, ExternalLink } from 'lucide-react'
import { ZONES } from '../data/zones'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

// First date (today or later) that falls on one of the pickup weekdays.
function nextDate(days) {
  const d = new Date()
  for (let i = 0; i < 8; i++) {
    if (days.includes(d.getDay())) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
}
const pretty = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

// Builds a calendar file (.ics): repeats weekly, with an alert the evening before.
function addToCalendar(title, days) {
  const s = nextDate(days), p = n => String(n).padStart(2, '0')
  const d = `${s.getFullYear()}${p(s.getMonth() + 1)}${p(s.getDate())}`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SortItOut//EN', 'BEGIN:VEVENT',
    `UID:${title.replace(/\W/g, '')}-${d}@sortitout`, `DTSTAMP:${d}T000000Z`,
    `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${title} pickup`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days.map(x => ICS_DAY[x]).join(',')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT6H', 'ACTION:DISPLAY', 'DESCRIPTION:Set it out tonight', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = `${title.replace(/\W/g, '-')}-pickup.ics`
  a.click()
}

export default function Pickup() {
  const [zone, setZone] = useState(0)
  const [address, setAddress] = useState('')
  const z = ZONES[zone]

  // Typing an address picks the zone when we recognise the neighborhood.
  function onAddress(v) {
    setAddress(v)
    const i = ZONES.findIndex(x => new RegExp(x.match).test(v.toLowerCase()))
    if (i >= 0) setZone(i)
  }

  const rows = [['Trash', z.trash, '#5F6B76'], ['Recycling', z.recycling, '#1E6BD6'], ['Curbside compost', z.organics, '#7A4A27']]

  return (
    <section>
      <h1 className="page-h">When is pickup?</h1>
      <p className="muted">Type your street or choose a zone. These are sample schedules for the prototype; confirm with DSNY before relying on them.</p>

      <div className="two">
        <input className="input" value={address} onChange={e => onAddress(e.target.value)} placeholder="e.g. Bedford Ave, Williamsburg" aria-label="Street or neighborhood" />
        <select className="input" value={zone} onChange={e => setZone(+e.target.value)} aria-label="Zone">
          {ZONES.map((x, i) => <option key={x.name} value={i}>{x.name}</option>)}
        </select>
      </div>

      <div className="dgrid" style={{ marginTop: 16 }}>
        {rows.map(([label, days, color]) => (
          <div key={label} className="vcard" style={{ '--c': color }}>
            <b>{label}</b>
            <span className="bigdate">{pretty(nextDate(days))}</span>
            <span className="muted small">Every {days.map(d => DAY[d]).join(' & ')}</span>
            <button className="btn" onClick={() => addToCalendar(label, days)}><Bell size={15} aria-hidden="true" />Remind me</button>
          </div>
        ))}
      </div>

      <div className="vcard" style={{ '--c': '#B26A00', marginTop: 16, maxWidth: 560 }}>
        <b>Fridge or air conditioner?</b>
        <span className="muted small">Refrigerant has to be removed first, and appointments have limited dates each month. Book early.</span>
        <a className="btn primary" href="https://portal.311.nyc.gov/" target="_blank" rel="noreferrer"><ExternalLink size={15} aria-hidden="true" />Book on 311</a>
      </div>
      <p className="muted small" style={{ marginTop: 18 }}>“Remind me” downloads a calendar file with a repeating weekly alert. Open it and your phone adds it. Check DSNY for the exact set-out time for your building.</p>
    </section>
  )
}