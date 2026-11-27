import { useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import { matchingFacilities } from '../data/disposal'
import { TILES } from '../lib/basemap'
import { distMiles, locate } from '../lib/geo'
import { OfficialLink, sourceLabel, TestingLabel } from './DisposalCatalog'

function Facility({ site, nearest, locationStatus, requestLocation, onMore }) {
  const point = [site.lat, site.lng]
  const hours = site.serviceHours.length ? site.serviceHours.join(' · ') : site.hours
  return <>
    <div className="journey-place">
      <small>{nearest ? 'Nearest facility' : 'Matching facility'}</small>
      <strong>{site.name}</strong>
      <span>{[site.address, site.borough, site.zip].filter(Boolean).join(', ')}</span>
      <span>Hours: {hours || 'Not listed'}</span>
      {!nearest && <span className="small muted" role="status">{locationStatus}</span>}
      {!nearest && locationStatus !== 'Finding your location…' && <button className="btn" onClick={requestLocation}>Use my location</button>}
    </div>
    <div className="journey-map" aria-label={'Map of ' + site.name}>
      <MapContainer key={site.id} center={point} zoom={14} scrollWheelZoom={false} className="journey-minimap">
        <TileLayer url={TILES.light} subdomains="abcd" attribution="© OpenStreetMap, © CARTO" />
        <CircleMarker center={point} radius={8} pathOptions={{ color: '#fff', fillColor: '#087c69', fillOpacity: 1 }} />
      </MapContainer>
      <button className="btn primary" onClick={onMore}><MapPin size={16} />Find more facilities</button>
    </div>
  </>
}

function Option({ item, rule, position, locationStatus, requestLocation, onMap }) {
  const [expanded, setExpanded] = useState(false)
  const sites = matchingFacilities(item.id, rule.id)
  const site = position && sites.length ? sites.reduce((best, next) =>
    distMiles(position, [next.lat, next.lng]) < distMiles(position, [best.lat, best.lng]) ? next : best) : sites[0]
  const prohibited = rule.status === 'prohibited'
  return <details className="disposal-rule" name={'journey-' + item.id} onToggle={event => {
    const open = event.currentTarget.open
    setExpanded(open)
    if (open && site && !position && !locationStatus) requestLocation()
  }}>
    <summary><b>{rule.method}</b> <span className={prohibited ? 'disposal-warning' : 'muted'}>{rule.status}</span>
      {['Conditions', 'Restrictions'].map(label => rule.details[label] && <small className="journey-condition" key={label}><b>{label}</b> · {rule.details[label]}</small>)}
    </summary>
    {expanded && <div className={site ? 'journey-body has-place' : 'journey-body'}>
      {site && <Facility site={site} nearest={Boolean(position)} locationStatus={locationStatus} requestLocation={requestLocation} onMore={() => onMap({ itemId: item.id, ruleId: rule.id })} />}
      {!site && !prohibited && (rule.facilityType || rule.method === 'Donate') && <p className="small muted">No verified facility is listed for this option.</p>}
      <div className="actions">
        {rule.sources.map(([url]) => <OfficialLink key={url} url={url}>{sourceLabel(url)}</OfficialLink>)}
        {!prohibited && rule.collection && <OfficialLink url={rule.collection[1]}>{rule.collection[0]}</OfficialLink>}
      </div>
    </div>}
  </details>
}

export default function JourneyOptions({ item, onMap }) {
  const [position, setPosition] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const pending = useRef(false)
  function requestLocation() {
    if (pending.current) return
    pending.current = true
    setLocationStatus('Finding your location…')
    locate(point => { pending.current = false; setPosition(point); setLocationStatus('') },
      message => { pending.current = false; setLocationStatus(message) })
  }
  return <>
    <TestingLabel rule={item.rules.find(rule => rule.publicationStatus === 'controlled_testing_ready')} />
    {item.rules.map(rule => <Option key={rule.id} item={item} rule={rule} position={position} locationStatus={locationStatus} requestLocation={requestLocation} onMap={onMap} />)}
  </>
}
