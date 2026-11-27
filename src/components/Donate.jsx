import { useMemo, useRef, useState } from 'react'
import { Search, MapPin, Navigation, LocateFixed, Gift, Apple } from 'lucide-react'
import { DONATE, donationCategories, donationSources, matchesDonation } from '../data/donate'
import { donationLocations } from '../data/donationLocations'
import { distMiles, directionsUrl, locate } from '../lib/geo'

const foodCategory = 'Food & Daily Essentials'

export default function Donate({ onMap }) {
  const [q, setQ] = useState('')
  const [user, setUser] = useState(null)
  const [msg, setMsg] = useState('')
  const [section, setSection] = useState('All')
  const [selected, setSelected] = useState(null)
  const [limit, setLimit] = useState(6)
  const results = useRef(null)

  const list = useMemo(() => {
    return DONATE.filter(item => (section === 'All' || item.site_category === section) && matchesDonation(item, q))
  }, [q, section])

  const places = useMemo(() => donationLocations(selected?.name)
    .map(s => ({ ...s, miles: user ? distMiles(user, [s.lat, s.lng]) : null }))
    .sort((a, b) => user ? a.miles - b.miles : (b.borough === 'Brooklyn') - (a.borough === 'Brooklyn'))
    , [user, selected])

  function choose(d) {
    setSelected(d)
    setLimit(6)
    requestAnimationFrame(() => results.current?.focus())
  }

  return (
    <section>
      <h1 className="page-h">Donation directory</h1>
      <p className="muted">Choose a donation category or search for an item to find organizations to contact. Item-specific donation rules are testing guidance.</p>

      <div className="dsearch">
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={e => { setQ(e.target.value); setSelected(null) }} placeholder="Try a couch, books, or canned food" aria-label="Search donation items" />
      </div>
      <div className="filter-caption"><strong>Donation category</strong></div>
      <div className="cats disposal-filters" role="group" aria-label="Donation category">
        {['All', ...donationCategories].map(name => <button key={name} className={'chip' + (name === section ? ' on' : '')} aria-pressed={name === section} onClick={() => { setSection(name); setSelected(null) }}>{name}</button>)}
      </div>
      <div className="dgrid">
        {list.map(d => (
          <div key={d.slug} className="vcard" style={{ '--c': '#C42675' }}>
            <b>{(d.site_category === foodCategory) ? <Apple className="filter-icon" size={16} /> : <Gift className="filter-icon" size={16} />}{d.name}</b>
            <button className="btn" onClick={() => choose(d)}>Browse directory</button>
          </div>
        ))}
      </div>
      {!list.length && <p className="muted">Nothing matches. Policies differ by organization, so call ahead for unusual items.</p>}

      {selected && <section>
      <h2 className="h2" tabIndex={-1} ref={results}>Donation guidance · {selected.name}</h2>
      {selected.source_rule_condition && <p>{selected.source_rule_condition}</p>}
      {selected.eligibility_display_key !== 'not_standard' && <p>{selected.preparation_tip}</p>}
      {(['special_review', 'special_program', 'not_standard'].includes(selected.eligibility_display_key) || selected.slug === 'mattress') && <p>{selected.caution}</p>}
      <p className="muted">{places.length ? `${places.length} directory listings mention this donation category. Confirm your specific item and its condition with the organization.` : 'No item-specific receiving location is confirmed in this directory.'}</p>
      <div className="bar2">
        {places.length > 0 && <button className="btn" onClick={() => { setMsg('Finding you…'); locate(p => { setUser(p); setMsg('') }, setMsg) }}><LocateFixed size={16} aria-hidden="true" />Sort by distance</button>}
        {places.length > 0 && <button className="btn primary" onClick={() => onMap({ donation: selected.name })}><MapPin size={16} aria-hidden="true" />View matching locations on map</button>}
        {selected.slug === 'car-seat' && <a className="btn" href={donationSources['Used car seat guidance']} target="_blank" rel="noreferrer">Car seat safety checklist</a>}
        {selected.eligibility_display_key !== 'not_standard' && <a className="btn" href={donationSources['DSNY donateNYC']} target="_blank" rel="noreferrer">Visit donateNYC</a>}
      </div>
      {msg && <p className="muted small">{msg}</p>}
      <div className="dgrid">
        {places.slice(0, limit).map(s => (
          <div key={s.id} className="vcard" style={{ '--c': '#C42675' }}>
            <b>{s.name}</b>
            <span className="muted small">{s.nta ? `${s.nta}, ${s.borough}` : `${s.borough} ${s.cd}`}{s.miles != null ? ` · ${s.miles.toFixed(1)} mi` : ''} · {s.hours}</span>
            <span className="small">{s.accepts}</span>
            {s.address && <span className="small">{s.address}</span>}
            {s.description && <p className="small">{s.description}</p>}
            {s.website && <a className="btn" href={s.website} target="_blank" rel="noreferrer">Check with organization</a>}
            <a className="btn" href={directionsUrl(s)} target="_blank" rel="noreferrer"><Navigation size={14} aria-hidden="true" />Directions</a>
          </div>
        ))}
      </div>
      {places.length > limit && <button className="btn" onClick={() => setLimit(limit + 6)}>Show more locations</button>}
      </section>}
    </section>
  )
}
