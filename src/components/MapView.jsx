import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { SITES } from '../data/sites'
import { LAYERS } from '../data/layers'
import SuggestForm from './SuggestForm'

const pin = color => L.divIcon({
  className: '',
  html: `<span class="pin" style="background:${color}"></span>`,
  iconSize: [20, 20], iconAnchor: [10, 20], popupAnchor: [0, -18],
})

// When arriving from a search result, zoom to the pins that are showing.
function FitOnce({ points }) {
  const map = useMap()
  useEffect(() => { if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 }) }, []) // eslint-disable-line
  return null
}
// When a place in the list is clicked, fly there.
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], 15) }, [target, map])
  return null
}

export default function MapView({ presetLayer }) {
  const [on, setOn] = useState(() => new Set(presetLayer ? [presetLayer] : Object.keys(LAYERS)))
  const [borough, setBorough] = useState('')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState(null)
  const [drawer, setDrawer] = useState(false)

  const toggle = k => setOn(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  const shown = useMemo(() => SITES.filter(s =>
    on.has(s.layer) &&
    (!borough || s.borough === borough) &&
    (!q || (s.name + ' ' + s.accepts + ' ' + s.address).toLowerCase().includes(q.toLowerCase()))
  ), [on, borough, q])

  return (
    <section>
      <div className="bar">
        {Object.entries(LAYERS).map(([k, l]) => (
          <button key={k} className={'chip' + (on.has(k) ? ' on' : '')} onClick={() => toggle(k)}>
            <span className="dot" style={{ background: l.color, marginRight: 6 }} />{l.name}
          </button>
        ))}
      </div>
      <div className="bar">
        <input className="mini" value={q} onChange={e => setQ(e.target.value)} placeholder="Search places or items" aria-label="Search places" />
        <select className="mini" value={borough} onChange={e => setBorough(e.target.value)} aria-label="Borough">
          <option value="">All boroughs</option><option>Brooklyn</option><option>Bronx</option><option>Queens</option>
        </select>
        <button className="btn primary" onClick={() => setDrawer(true)}>Suggest a place or fix</button>
      </div>

      <div className="split">
        <div className="list">
          {shown.length ? shown.map(s => (
            <button key={s.id} className="site" onClick={() => setTarget(s)}>
              <span className="dot" style={{ background: LAYERS[s.layer].color, marginRight: 8 }} />
              <b>{s.name}</b>
              <div className="muted">{s.borough} {s.cd} · {s.hours}</div>
              <div>{s.accepts}</div>
            </button>
          )) : <p className="muted pad">No places match. Turn on more layers or clear the search.</p>}
        </div>

        <MapContainer center={[40.6782, -73.9442]} zoom={12} className="map">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd" maxZoom={19} attribution="© OpenStreetMap, © CARTO"
          />
          {presetLayer && <FitOnce points={shown.map(s => [s.lat, s.lng])} />}
          <FlyTo target={target} />
          {shown.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={pin(LAYERS[s.layer].color)}>
              <Popup>
                <b>{s.name}</b><br />{s.address}, {s.borough} {s.cd}<br />{s.hours}<br />
                <i>Accepts:</i> {s.accepts}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="muted">Sample locations for the prototype. Hours and accepted items must be verified.</p>
      {drawer && <SuggestForm onClose={() => setDrawer(false)} />}
    </section>
  )
}