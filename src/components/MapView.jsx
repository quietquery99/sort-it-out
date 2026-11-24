import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed, Plus, Navigation } from 'lucide-react'
import { SITES } from '../data/sites'
import { LAYERS } from '../data/layers'
import { distMiles, directionsUrl, locate } from '../lib/geo'
import SuggestForm from './SuggestForm'

// Dark map in dark mode, light map in light mode.
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

const pin = (color, big) => L.divIcon({
  className: '',
  html: `<span class="pin${big ? ' big' : ''}" style="background:${color}"></span>`,
  iconSize: big ? [30, 30] : [20, 20], iconAnchor: big ? [15, 30] : [10, 20], popupAnchor: [0, -20],
})

// Invisible helper that moves the map when the app asks it to.
function Controller({ pts, fit, focus, user }) {
  const map = useMap()
  useEffect(() => { if (fit > 0 && pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 }) }, [fit]) // eslint-disable-line
  useEffect(() => { if (focus) map.flyTo([focus.lat, focus.lng], 15) }, [focus, map])
  useEffect(() => { if (user) map.flyTo(user, 14) }, [user, map])
  return null
}

export default function MapView({ presetLayer, theme }) {
  const [on, setOn] = useState(() => new Set(presetLayer ? [presetLayer] : Object.keys(LAYERS)))
  const [borough, setBorough] = useState('')
  const [q, setQ] = useState('')
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')
  const [focus, setFocus] = useState(null)
  const [fit, setFit] = useState(presetLayer ? 1 : 0)
  const [form, setForm] = useState(false)

  const toggle = k => setOn(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })

  // The sites to show (filtered, and closest-first once we know where the user is).
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return SITES
      .filter(s => on.has(s.layer) && (!borough || s.borough === borough) && (!t || (s.name + ' ' + s.accepts + ' ' + s.address).toLowerCase().includes(t)))
      .map(s => ({ ...s, miles: user ? distMiles(user, [s.lat, s.lng]) : null }))
      .sort((a, b) => (user ? a.miles - b.miles : 0))
  }, [on, borough, q, user])

  const nearMe = () => { setMsg('Finding you…'); locate(p => { setUser(p); setMsg('') }, setMsg) }

  return (
    <section>
      <h1 className="page-h">Find a place</h1>
      <p className="muted">Compost drop-offs, e-waste, hazardous sites, reuse shops and repair events. Tap a pin or a card.</p>

      <div className="cats">
        {Object.entries(LAYERS).map(([k, l]) => (
          <button key={k} className={'chip' + (on.has(k) ? ' on' : '')} onClick={() => toggle(k)}>
            <span className="cdot" style={{ background: l.color }} />{l.name}
          </button>
        ))}
      </div>

      <div className="bar2">
        <input className="minput" value={q} onChange={e => setQ(e.target.value)} placeholder="Search places or items" aria-label="Search places" />
        <select className="minput" value={borough} onChange={e => { setBorough(e.target.value); setFit(f => f + 1) }} aria-label="Borough">
          <option value="">All boroughs</option><option>Brooklyn</option><option>Bronx</option><option>Queens</option>
        </select>
        <button className="btn" onClick={nearMe}><LocateFixed size={16} aria-hidden="true" />Near me</button>
        <button className="btn primary" onClick={() => setForm(true)}><Plus size={16} aria-hidden="true" />Suggest a place</button>
      </div>
      {msg && <p className="muted small">{msg}</p>}

      <div className="mapgrid">
        <div className="mlist">
          <p className="mcount">{shown.length} place{shown.length === 1 ? '' : 's'}{user ? ', closest first' : ''}</p>
          {shown.map(s => (
            <button key={s.id} className="msite" onClick={() => setFocus(s)}>
              <span className="cdot" style={{ background: LAYERS[s.layer].color }} />
              <span>
                <b>{s.name}</b>
                <span className="muted small">{s.borough} {s.cd}{s.miles != null ? ` · ${s.miles.toFixed(1)} mi` : ''}</span>
                <span className="small">{s.hours}</span>
              </span>
            </button>
          ))}
          {!shown.length && <p className="muted pad">No places match. Turn on more layers or clear the search.</p>}
        </div>

        <MapContainer center={[40.68, -73.95]} zoom={12} className="mapbox">
          <TileLayer key={theme} url={TILES[theme]} subdomains="abcd" maxZoom={19} attribution="© OpenStreetMap, © CARTO" />
          <Controller pts={shown.map(s => [s.lat, s.lng])} fit={fit} focus={focus} user={user} />
          {shown.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={pin(LAYERS[s.layer].color, focus?.id === s.id)}>
                            <Popup>
                <b>{s.name}</b><br />{s.address}, {s.borough} {s.cd}<br />{s.hours}<br />
                <i>Accepts:</i> {s.accepts}<br />
                {s.phone && <>{s.phone}<br /></>}
                {s.website && <><a href={s.website} target="_blank" rel="noreferrer">Website</a><br /></>}
                {s.sample && <><i>Sample location, not verified</i><br /></>}
                <a href={directionsUrl(s)} target="_blank" rel="noreferrer"><Navigation size={12} /> Directions</a>
              </Popup>
            </Marker>
          ))}
          {user && <CircleMarker center={user} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />}
        </MapContainer>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>Sample locations for the prototype. Hours and accepted items must be verified before launch.</p>
      {form && <SuggestForm onClose={() => setForm(false)} />}
    </section>
  )
}