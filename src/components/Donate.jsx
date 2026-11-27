import { useMemo, useRef, useState } from 'react'
import { Search, MapPin, Navigation, LocateFixed, LayoutGrid, Shirt, Armchair, BookOpen, Monitor, Blocks, Guitar, Wrench, Apple, HeartHandshake } from 'lucide-react'
import { DONATE, donationCategories, donationSources, matchesDonation } from '../data/donate'
import { catalog } from '../data/disposal'
import { donationLocations } from '../data/donationLocations'
import { distMiles, directionsUrl, locate } from '../lib/geo'

const categories = {
  All: [LayoutGrid, 'currentColor'],
  'Clothing & Accessories': [Shirt, '#C42675'],
  'Furniture & Home Goods': [Armchair, '#9B6040'],
  'Books, Media & School Supplies': [BookOpen, '#2463AD'],
  'Electronics & Appliances': [Monitor, '#7B3FE4'],
  'Toys & Baby Items': [Blocks, '#AD541B'],
  'Sports, Music & Hobbies': [Guitar, '#23774B'],
  'Tools & Building Materials': [Wrench, '#496A80'],
  'Food & Daily Essentials': [Apple, '#42752F'],
  'Specialized Donations': [HeartHandshake, '#087C72'],
}

const directoryCounts = new Map(DONATE.map(item => [item.slug, donationLocations(item.name).length]))
const ruleDetails = new Map(catalog.items.flatMap(item => item.rules.filter(rule => rule.method === 'Donate').map(rule => [rule.id, rule.details])))
const conditions = {
  category_example: 'Confirm the recipient accepts this item.',
  special_review: 'Check eligibility with a specialist or receiving program.',
  special_program: 'Use a program that explicitly accepts this item.',
  not_standard: 'Outside ordinary thrift-store donation.',
}

function DonationCard({ item, onChoose }) {
  const [Icon, color] = categories[item.site_category]
  const details = ruleDetails.get(item.source_rule_id)
  const count = directoryCounts.get(item.slug)
  const condition = details?.Conditions || item.source_rule_condition || conditions[item.eligibility_display_key]
  const restriction = details?.Restrictions || (item.eligibility_display_key === 'category_example'
    ? 'Item-specific acceptance is unverified.' : item.caution)
  return <article className="icard donation-item" style={{ '--c': color }}>
    <span className="disposal-card-icon"><Icon size={19} aria-hidden="true" /></span>
    <b>{item.name}</b>
    <dl><div><dt>Condition</dt><dd>{condition}</dd></div>
      <div><dt>Restriction</dt><dd>{restriction}</dd></div></dl>
    <span className="stream"><MapPin size={14} aria-hidden="true" />{count} directory {count === 1 ? 'location' : 'locations'}</span>
    <button className="btn" onClick={() => onChoose(item)}>Browse directory</button>
  </article>
}

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
      <p className="muted">Choose a donation category or search for an item to find organizations to contact.</p>

      <div className="dsearch">
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={e => { setQ(e.target.value); setSelected(null) }} placeholder="Try a couch, books, or canned food" aria-label="Search donation items" />
      </div>
      <div className="filter-caption"><strong>Donation category</strong></div>
      <div className="cats disposal-filters" role="group" aria-label="Donation category">
        {['All', ...donationCategories].map(name => {
          const [Icon, color] = categories[name]
          const active = name === section
          return <button key={name} className={'chip' + (active ? ' on' : '')} aria-pressed={active} onClick={() => { setSection(name); setSelected(null) }}>
            <Icon size={16} className="filter-icon" color={active ? 'currentColor' : color} aria-hidden="true" />{name}
          </button>
        })}
      </div>
      <div className="dgrid donation-grid">
        {list.map(item => <DonationCard key={item.slug} item={item} onChoose={choose} />)}
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
