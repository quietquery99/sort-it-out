import { useState } from 'react'
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

// Builds a calendar file (.ics) with a weekly repeat and an evening-before alert, then downloads it.
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

export default function Schedule() {
  const [zone, setZone] = useState(0)
  const [address, setAddress] = useState('')
  const z = ZONES[zone]

  // Typing an address picks the zone when we recognise the neighbourhood.
  function onAddress(v) {
    setAddress(v)
    const i = ZONES.findIndex(x => new RegExp(x.match).test(v.toLowerCase()))
    if (i >= 0) setZone(i)
  }

  const rows = [
    ['Trash', z.trash, '#555E66'],
    ['Recycling', z.recycling, '#1E6BD6'],
    ['Curbside organics', z.organics, '#7A4A27'],
  ]

  return (
    <section>
      <h1 style={{ fontSize: 36 }}>When is pickup?</h1>
      <p className="muted">Type an address or choose a zone. These are sample schedules for the prototype.</p>
      <div className="grid g2" style={{ margin: '16px 0' }}>
        <input className="input" value={address} onChange={e => onAddress(e.target.value)} placeholder="e.g. 120 Bedford Ave, Williamsburg" aria-label="Address" />
        <select className="input" value={zone} onChange={e => setZone(+e.target.value)} aria-label="Zone">
          {ZONES.map((x, i) => <option key={x.name} value={i}>{x.name}</option>)}
        </select>
      </div>
      <div className="grid g3">
        {rows.map(([label, days, color]) => (
          <div key={label} className="card" style={{ borderTop: `6px solid ${color}` }}>
            <h3>{label}</h3>
            <p style={{ fontSize: 22, fontWeight: 600, margin: '10px 0 2px' }}>{pretty(nextDate(days))}</p>
            <p className="muted">Every {days.map(d => DAY[d]).join(' & ')}</p>
            <button className="btn" onClick={() => addToCalendar(label, days)}>Add to calendar</button>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Air conditioner or fridge?</h3>
        <p className="muted">Refrigerant must be removed before pickup. Book a CFC removal appointment through{' '}
          <a href="https://portal.311.nyc.gov/" target="_blank" rel="noreferrer">311</a>.</p>
      </div>
    </section>
  )
}