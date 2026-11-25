import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MapPin, ExternalLink, Lightbulb, Navigation, LocateFixed, Clock, X } from 'lucide-react'
import { GUIDES, DOES } from '../data/guides'
import { TIPS, KINDS } from '../data/reuse'
import { ITEMS } from '../data/items'
import { STREAMS } from '../data/streams'
import { SITES } from '../data/sites'
import { LAYERS } from '../data/layers'
import { distMiles, directionsUrl, locate } from '../lib/geo'

const DSNY = 'https://www.nyc.gov/site/dsny/collection/get-rid-of.page'
const SHOW = 6   // how many map sites to list before "see all on the map"
const searchMap = address => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

// Both kinds of site (the ones written in guides.js and the ones from the map) are turned into
// the same shape, so one tile and one pop-up can show either.
const fromGuide = s => ({
  name: s.name, tags: (s.does || []).map(k => DOES[k]).filter(Boolean), note: s.note,
  address: s.address, hours: s.hours, website: s.href,
  directions: s.address && s.address !== 'TO WRITE' ? searchMap(s.address) : '',
})
const fromMap = s => ({
  name: s.name, tags: [LAYERS[s.layer]?.name].filter(Boolean), note: s.accepts && `Accepts: ${s.accepts}`,
  address: s.address, hours: s.hours, website: s.website, where: s.nta ? `${s.nta}, ${s.borough}` : s.borough,
  miles: s.miles, directions: directionsUrl(s),
})

// A square tile. Clicking it opens the pop-up.
function Tile({ site, onOpen }) {
  return (
    <button className="site-tile" onClick={() => onOpen(site)}>
      <b>{site.name}</b>
      {site.where && <span className="muted small">{site.where}{site.miles != null ? ` · ${site.miles.toFixed(1)} mi` : ''}</span>}
      {site.tags.length > 0 && <span className="tile-tags">{site.tags.map(t => <span key={t} className="tag">{t}</span>)}</span>}
    </button>
  )
}

// The little pop-up with a site's details.
function SitePopup({ site, onClose }) {
  useEffect(() => {   // Escape closes it
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet site-pop" role="dialog" aria-modal="true" aria-label={site.name} onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h2>{site.name}</h2>
        {site.tags.length > 0 && <div className="tile-tags">{site.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
        {site.note && <p>{site.note}</p>}
        {site.address && <p><MapPin size={15} aria-hidden="true" /> {site.address}{site.where ? ` (${site.where})` : ''}</p>}
        {site.hours && <p><Clock size={15} aria-hidden="true" /> {site.hours}</p>}
        <div className="actions">
          {site.directions && <a className="btn primary" href={site.directions} target="_blank" rel="noreferrer"><Navigation size={14} aria-hidden="true" />Directions</a>}
          {site.website && <a className="btn" href={site.website} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />Website</a>}
        </div>
      </div>
    </div>
  )
}

// An informational guide page for one item (e.g. clothes). `id` is the item id from items.js;
// the writing comes from guides.js, and "Where to take it" comes from the map's disposal sites.
export default function Guide({ id, onBack, onMap }) {
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState(null)   // the site whose pop-up is showing
  const g = GUIDES[id]
  const item = ITEMS.find(i => i.id === id)   // the item's disposal rule from items.js
  const tips = TIPS[id] || []                 // short tips from reuse.js, shown as "quick ideas"

  // Map sites for this item's map layer: closest first once we know where the user is,
  // otherwise Brooklyn (the pilot borough) first.
  const mapSites = useMemo(() => !item?.layer ? [] : SITES
    .filter(s => s.layer === item.layer)
    .map(s => ({ ...s, miles: user ? distMiles(user, [s.lat, s.lng]) : null }))
    .sort((a, b) => user ? a.miles - b.miles : (b.borough === 'Brooklyn') - (a.borough === 'Brooklyn')), [item, user])

  // If someone lands here with an id that has no guide, don't crash: offer a way back.
  if (!g) return (
    <section>
      <p className="muted">There’s no guide for this item yet.</p>
      <button className="btn" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back to Disposal</button>
    </section>
  )

  return (
    <section className="guide">
      <button className="btn" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back to Disposal</button>
      <h1 className="page-h">{g.title}</h1>
      {g.intro && <p className="sub">{g.intro}</p>}

      {g.fact && (
        <p className="note"><Lightbulb size={16} aria-hidden="true" /> {g.fact.text} {g.fact.source && <span className="muted small">Source: {g.fact.source}</span>}</p>
      )}

      {tips.length > 0 && (
        <div className="tips">
          <h2 className="h2">Quick ideas</h2>
          <ul>{tips.map((t, k) => <li key={k}><span className="tip-kind">{KINDS[t.kind]}</span>{t.text}</li>)}</ul>
        </div>
      )}

      {/* Each section: heading, paragraphs, then its sites as tiles. */}
      {(g.sections || []).map((sec, k) => (
        <div key={k} className="guide-section">
          <h2 className="h2">{sec.heading}</h2>
          {sec.points.map((p, j) => <p key={j}>{p}</p>)}
          {sec.sites?.length > 0 && (
            <div className="tile-grid">
              {sec.sites.map(s => <Tile key={s.name} site={fromGuide(s)} onOpen={setOpen} />)}
            </div>
          )}
        </div>
      ))}

      {/* Pulled from the map's disposal sites, so nothing extra to maintain here. */}
      {mapSites.length > 0 && (
        <div className="guide-section">
          <h2 className="h2">Where to take it</h2>
          <div className="bar2">
            <button className="btn" onClick={() => { setMsg('Finding you…'); locate(p => { setUser(p); setMsg('') }, setMsg) }}><LocateFixed size={16} aria-hidden="true" />Sort by distance</button>
            <button className="btn primary" onClick={() => onMap(item.layer)}><MapPin size={16} aria-hidden="true" />See all {mapSites.length} on the map</button>
          </div>
          {msg && <p className="muted small">{msg}</p>}
          <div className="tile-grid">
            {mapSites.slice(0, SHOW).map(s => <Tile key={s.id} site={fromMap(s)} onOpen={setOpen} />)}
          </div>
        </div>
      )}

      {/* The official disposal steps from items.js. */}
      {item && (
        <div className="guide-section">
          <h2 className="h2">If it has to go</h2>
          <div className="vcard" style={{ '--c': STREAMS[item.stream].color }}>
            <b>{STREAMS[item.stream].name}</b>
            <ol>{item.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
            <span className="muted small">{item.impact}</span>
            <a className="btn" href={DSNY} target="_blank" rel="noreferrer"><ExternalLink size={14} aria-hidden="true" />DSNY guide</a>
          </div>
        </div>
      )}

      {open && <SitePopup site={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
