import { TILES } from '../lib/basemap'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed, Plus, Navigation } from 'lucide-react'
import { SITES } from '../data/sites'
import { catalog, itemsById, matchingFacilities, officialGuide } from '../data/disposal'

// Every borough that has at least one site, so new data adds its borough to the dropdown automatically.
const BOROUGHS = [...new Set(SITES.map(s => s.borough).filter(Boolean))].sort()
import { LAYERS } from '../data/layers'
import { distMiles, directionsUrl, locate } from '../lib/geo'
import SuggestForm from './SuggestForm'
import { donationLocations } from '../data/donationLocations'
import PublicBaskets from './PublicBaskets'

const facilities = Object.values(catalog.facilities)
const hasFacilityDirectory = facilities.length > 0
const directory = SITES.filter(site => !site.sample)
const directoryLayers = [...new Set(directory.flatMap(site => site.layers))]
const facilityTypes = [...new Set(facilities.map(site => site.type))].sort()
const facilityColors = {
  'Medical Waste Drop-Off Location': '#7B3FE4',
  'Paint Recycling Location': '#0E8F8F',
  'Smart Composting Bin': LAYERS.compost.color,
  'Special Waste Drop-Off Site': LAYERS.safe.color,
  'Textile Drop-Off Site': LAYERS.textile.color,
}
const facilityTypeByLayer = {
  compost: 'Smart Composting Bin',
  safe: 'Special Waste Drop-Off Site',
  textile: 'Textile Drop-Off Site',
}
const pin = (color, big) => L.divIcon({
  className: '',
  html: `<span class="pin${big ? ' big' : ''}" style="background:${color}"></span>`,
  iconSize: big ? [30, 30] : [20, 20], iconAnchor: big ? [15, 30] : [10, 20], popupAnchor: [0, -20],
})

// Invisible helper that moves the map when the app asks it to.
function Controller({ pts, fit, focus, user }) {
  const map = useMap()
  useEffect(() => { if (fit > 0 && pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14, animate: false }) }, [fit]) // eslint-disable-line
  useEffect(() => { if (focus) map.flyTo([focus.lat, focus.lng], 15) }, [focus, map])
  useEffect(() => { if (user) map.flyTo(user, 14) }, [user, map])
  return null
}

export default function MapView({ presetLayer, presetDisposal, presetDonation, onOpenItem, theme }) {
  const [donation, setDonation] = useState(presetDonation)
  const [disposal, setDisposal] = useState(presetDisposal)
  const [earlier, setEarlier] = useState(Boolean(presetLayer || presetDonation))
  const [publicDisposal, setPublicDisposal] = useState(false)
  const [directoryLayer, setDirectoryLayer] = useState(presetLayer || '')
  const [facilityType, setFacilityType] = useState(() => facilityTypeByLayer[presetLayer] || '')
  const item = itemsById.get(disposal?.itemId)
  const rule = item?.rules.find(option => option.id === disposal?.ruleId)
  const useFacilityData = hasFacilityDirectory && facilityTypes.length > 0 && !earlier
  const [on, setOn] = useState(() => new Set(presetLayer ? [presetLayer] : Object.keys(LAYERS)))
  const [borough, setBorough] = useState('')
  const [q, setQ] = useState('')
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')
  const [focus, setFocus] = useState(null)
  const [fit, setFit] = useState(presetLayer || presetDisposal || presetDonation ? 1 : 0)
  const [form, setForm] = useState(false)

  const toggle = k => setOn(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  // Pin color: the site's first category that is switched on (so a food + textiles site turns
  // green when only "Food donation" is on).
  const colorOf = s => s.type ? facilityColors[s.type] || LAYERS.safe.color
    : disposal ? LAYERS.safe.color : LAYERS[s.layers.find(l => on.has(l)) || s.layer].color

  // The sites to show (filtered, and closest-first once we know where the user is).
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    const sites = donation ? donationLocations(donation) : disposal ? matchingFacilities(disposal.itemId, disposal.ruleId) : useFacilityData ? facilities : hasFacilityDirectory ? directory : SITES
    return sites
      .filter(s => {
        const categoryMatch = disposal || (useFacilityData ? !facilityType || s.type === facilityType :
          hasFacilityDirectory ? !directoryLayer || s.layers.includes(directoryLayer) : s.layers.some(l => on.has(l)))
        return categoryMatch && (!borough || s.borough === borough) &&
          (!t || [s.name, s.type, s.accepts, s.operator, s.nta, s.address, s.zip, s.borough].join(' ').toLowerCase().includes(t))
      })
      .map(s => ({ ...s, miles: user ? distMiles(user, [s.lat, s.lng]) : null }))
      .sort((a, b) => (user ? a.miles - b.miles : 0))
  }, [on, borough, q, user, disposal, donation, useFacilityData, facilityType, directoryLayer])

  const nearMe = () => { setMsg('Finding you…'); locate(p => { setUser(p); setMsg('') }, setMsg) }
  const filterFacilities = type => {
    setFacilityType(type)
    setFocus(null)
    setFit(f => f + 1)
  }
  const switchDirectory = value => {
    setDonation(null)
    setEarlier(value)
    setDirectoryLayer('')
    setQ('')
    filterFacilities('')
  }

  return (
    <section>
      <h1 className="page-h">Find a place</h1>
      {!disposal && <>
        <div className="filter-caption"><strong>Location type</strong><span>Choose where your waste comes from.</span></div>
        <div className="cats map-facility-filters" role="group" aria-label="Location type">
          <button className={'chip' + (!publicDisposal ? ' on' : '')} aria-pressed={!publicDisposal} onClick={() => setPublicDisposal(false)}>Household drop-off &amp; donation facilities</button>
          <button className={'chip' + (publicDisposal ? ' on' : '')} aria-pressed={publicDisposal} onClick={() => setPublicDisposal(true)}>Public Litter Baskets</button>
        </div>
      </>}
      {publicDisposal ? <PublicBaskets tileUrl={TILES[theme]} /> : <>
      <p className="muted">{hasFacilityDirectory && earlier ? 'Earlier NYC Open Data and donation directory listings. Confirm current hours and accepted items with the location.' : 'Browse NYC facilities by type. Tap a pin or a card.'}</p>
      {hasFacilityDirectory && !disposal && <div className="filter-caption"><strong>Facility directory</strong><span>Choose a collection of locations to explore.</span></div>}
      {hasFacilityDirectory && !disposal && <div className="cats map-facility-filters" role="group" aria-label="Map directory">
        <button className={'chip' + (!earlier ? ' on' : '')} aria-pressed={!earlier} onClick={() => switchDirectory(false)}>Verified facilities</button>
        <button className={'chip' + (earlier ? ' on' : '')} aria-pressed={earlier} onClick={() => switchDirectory(true)}>Compost, donation &amp; reuse directory</button>
      </div>}

      <div className="filter-caption"><strong>{disposal ? 'Selected disposal pathway' : 'Facility category'}</strong>{!disposal && <span>Filter the locations in this directory.</span>}</div>
      {donation ? <div className="cats"><span className="chip on">{donation}</span><button className="chip" onClick={() => { setDonation(null); filterFacilities('') }}>Clear donation filter</button></div> : disposal ? <div className="cats">
        <button className="chip on" onClick={() => onOpenItem(item.id)}>{item?.name} · {rule?.method}</button>
        <button className="chip" onClick={() => { setDisposal(null); filterFacilities('') }}>Clear disposal filter</button>
      </div> : useFacilityData ? <div className="cats map-facility-filters" role="group" aria-label="Filter by facility category">
        <button className={'chip' + (!facilityType ? ' on' : '')} aria-pressed={!facilityType} onClick={() => filterFacilities('')}>All facilities</button>
        {facilityTypes.map(type => (
          <button key={type} className={'chip' + (facilityType === type ? ' on' : '')} aria-pressed={facilityType === type} onClick={() => filterFacilities(type)}>
            <span className="cdot" style={{ background: facilityColors[type] || LAYERS.safe.color }} />{type}
          </button>
        ))}
      </div> : hasFacilityDirectory ? <div className="cats map-facility-filters" role="group" aria-label="Directory categories">
        {['', ...directoryLayers].map(layer => <button key={layer} className={'chip' + (directoryLayer === layer ? ' on' : '')} aria-pressed={directoryLayer === layer}
          onClick={() => { setDirectoryLayer(layer); setFocus(null); setFit(f => f + 1) }}>{layer ? LAYERS[layer].name : 'All listings'}</button>)}
      </div> : <div className="cats">
        {Object.entries(LAYERS).map(([k, l]) => (
          <button key={k} className={'chip' + (on.has(k) ? ' on' : '')} onClick={() => toggle(k)}>
            <span className="cdot" style={{ background: l.color }} />{l.name}
          </button>
        ))}
      </div>}

      <div className="filter-caption"><strong>Search and borough</strong></div>
      <div className="bar2">
        <input className="minput" value={q} onChange={e => setQ(e.target.value)} placeholder="Search places or items" aria-label="Search places" />
        <select className="minput" value={borough} onChange={e => { setBorough(e.target.value); setFit(f => f + 1) }} aria-label="Borough">
          <option value="">All boroughs</option>
          {BOROUGHS.map(b => <option key={b}>{b}</option>)}
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
              <span className="cdot" style={{ background: colorOf(s) }} />
              <span>
                <b>{s.name}</b>
                <span className="muted small">{[s.nta, s.borough, s.cd].filter(Boolean).join(', ')}{s.miles != null ? ` · ${s.miles.toFixed(1)} mi` : ''}</span>
                <span className="small">{s.type || s.hours}</span>
              </span>
            </button>
          ))}
          {!shown.length && (disposal
            ? <p className="muted pad">No verified facilities match these filters. <a href={rule?.sources[0]?.[0] || officialGuide} target="_blank" rel="noreferrer">See official guidance</a>.</p>
            : <p className="muted pad">No places match. Try another category or clear the search.</p>)}
        </div>

        <MapContainer center={[40.68, -73.95]} zoom={12} className="mapbox">
          <TileLayer key={theme} url={TILES[theme]} subdomains="abcd" maxZoom={19} attribution="© OpenStreetMap, © CARTO" />
          <Controller pts={shown.map(s => [s.lat, s.lng])} fit={fit} focus={focus} user={user} />
          {shown.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={pin(colorOf(s), focus?.id === s.id)}>
                            <Popup>
                <b>{s.name}</b><br />{s.address}<br />{[s.nta, s.borough, s.cd].filter(Boolean).join(', ')}<br />
                {s.operator && <div>Operator: {s.operator}</div>}
                {s.hours && <div>Listed hours: {s.hours}</div>}
                {s.source && <div>Source: {s.source}</div>}
                {s.description && <>{s.description}<br /></>}
                {disposal ? <>
                  <i>Acceptance for {item?.name}</i>
                  <ul>{s.notes.map(note => <li key={note}>{note}</li>)}</ul>
                  {s.verified && <>Last verified {s.verified}<br /></>}
                  {s.sources.map(url => <div key={url}><a href={url} target="_blank" rel="noreferrer">Facility requirements</a></div>)}
                  {item && <button className="btn" onClick={() => onOpenItem(item.id)}>View disposal rules</button>}
                </> : s.type ? <>
                  <span>{s.type}</span><br />
                  {s.verified && <>Last verified {s.verified}<br /></>}
                </> : <><i>Accepts:</i> {s.accepts}<br /></>}
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
      <p className="muted small" style={{ marginTop: 10 }}>{disposal || useFacilityData ? 'Check facility hours and acceptance conditions before visiting. Distances are straight-line.' : 'Sample locations for the prototype. Hours and accepted items must be verified before launch.'}</p>
      {form && <SuggestForm onClose={() => setForm(false)} />}
      </>}
    </section>
  )
}
