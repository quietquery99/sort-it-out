import { useMemo, useRef, useState } from 'react'
import { Search, Trash2, Gift, MapPin, CalendarDays, Flag, BookOpen, Mic } from 'lucide-react'
import Scene from './Scene'
import { SortyArt } from './Sorty'
import { publicSearchItems } from '../data/publicElectronics'
import { donationLocations } from '../data/donationLocations'
import { SITES } from '../data/sites'
import { LAYERS } from '../data/layers'
import { STREAMS } from '../data/streams'
import { catalog, journeyMatches, officialGuide } from '../data/disposal'
import JourneyOptions from './JourneyOptions'

const IDEAS = ['Old fridge', 'Lithium battery', 'Greasy pizza box', 'Mattress', 'Paint']

// "Everything in one place": one tile per tab.
const TILES = [
  ['sort',   'Disposal guide',   'Where does it go? 35+ items with steps.', Trash2,       '#1E6BD6'],
  ['donate', 'Donate',           'Can I donate it, and where?',             Gift,         '#C42675'],
  ['map',    'Map',              'Drop-offs, compost, e-waste, repair.',    MapPin,       '#7B3FE4'],
  ['pickup', 'Pickup days',      'Your days, with reminders.',              CalendarDays, '#23904F'],
  ['report', 'Report a problem', 'Overflow, dumping, missed pickup.',       Flag,         '#B26A00'],
  ['learn',  'Learn',            'Quick guides and a sorting game.',        BookOpen,     '#0E8F8F'],
]
const BINS = ['org', 'mgp', 'pap', 'ecy', 'don', 'safe']

export default function Home({ onMap, onItem, onTab, onSorty }) {
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState(null)
  const result = useRef(null)
  const [lookup, setLookup] = useState(null)
  const pending = useRef(null)
  const journey = catalog.items.length > 0
  const matches = useMemo(() => journeyMatches(q, journey ? catalog.items : publicSearchItems), [q, journey])
  const answer = lookup?.query === q ? lookup : null
  const item = chosen || matches.item || answer?.item
  const donation = item?.id === 'furniture' ? 'Furniture (clean and sturdy)' : null
  const listing = item && !item.rules && item.layer && (donation ? donationLocations(donation)[0] : SITES.find(site => !site.sample && site.layers.includes(item.layer)))
  const focusResult = () => requestAnimationFrame(() => result.current?.focus())
  const search = async value => {
    if (!value.trim()) return
    setQ(value)
    setChosen(null)
    focusResult()
    pending.current?.abort()
    setLookup(null)
    const direct = journeyMatches(value, journey ? catalog.items : publicSearchItems)
    if (direct.options.length || value.trim().length < 2) return
    const controller = new AbortController()
    pending.current = controller
    setLookup({ query: value, loading: true })
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: value }), signal: controller.signal })
      if (!response.ok) throw new Error('Lookup unavailable')
      const { id } = await response.json()
      const match = publicSearchItems.find(entry => entry.id === id)
      if (!controller.signal.aborted) setLookup({ query: value, item: match })
    } catch {
      if (!controller.signal.aborted) setLookup({ query: value, unavailable: true })
    }
  }

  return (
    <>
      <section className="hero">
        <Scene />
        <div className="hero-in">
          <p className="eyebrow">NYC residential waste, sorted</p>
          <h1>What are you getting rid of?</h1>
          <p className="sub">Find disposal rules and places that accept your item.</p>
          <form className="search" onSubmit={e => { e.preventDefault(); search(q) }}>
            <Search size={20} aria-hidden="true" />
            <input value={q} onChange={e => { pending.current?.abort(); setLookup(null); setQ(e.target.value); setChosen(null) }} placeholder="Ask about an item, e.g. where can I take my old laptop?" aria-label="Describe the item" />
            <button type="submit">Find out</button>
          </form>
          <div className="ideas">
            {(journey ? ['Laptop', 'Coffee cup', 'Batteries', 'Mattress', 'Pizza box'] : IDEAS).map(x => <button key={x} className="chip" onClick={() => search(x)}>{x}</button>)}
          </div>
        </div>

        <div className="perch">
          <div className="bubble"><Mic size={14} aria-hidden="true" /> Tap me and ask out loud!</div>
          <button className="sorty-hero" onClick={onSorty} aria-label="Talk to Sorty the pigeon"><SortyArt size={92} /></button>
          <div className="ledge" />
        </div>
      </section>
      {q.trim().length >= 2 && <section className="journey-result" aria-label="Your waste journey" tabIndex={-1} ref={result}>
        {item && !item.rules ? <>
          <h2>{item.name}</h2>
          <p>{item.cat} · {STREAMS[item.stream].name}</p>
          <details key={item.id} className="disposal-rule"><summary><b>{STREAMS[item.stream].name}</b></summary>
          <ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol>
          {listing && <div className="journey-place"><small>{LAYERS[item.layer]?.name} directory · Confirm item acceptance before visiting.</small>
            <strong>{listing.name}</strong><span>{[listing.address, listing.borough].filter(Boolean).join(', ')}</span>
            {listing.hours && <span>Hours: {listing.hours}</span>}
            <button className="btn" onClick={() => onMap(donation ? { donation } : item.layer)}>Browse locations</button>
          </div>}
          <a href={item.source || officialGuide} target="_blank" rel="noreferrer">View DSNY guide</a></details>
        </> : item ? <>
          <h2>{item.name}</h2>
          <p className="muted">{item.category} · {item.subcategory}{item.material && ' · ' + item.material}</p>
          <JourneyOptions key={item.id} item={item} onMap={onMap} />
          {item.rules.some(rule => rule.method === "Donate" && rule.status !== "prohibited") && <p className="small"><a href="https://www.nyc.gov/assets/donate/site/home" target="_blank" rel="noreferrer">Search donateNYC for reuse or repair services</a> · Confirm the item and service with the organization.</p>}
          <button className="btn" onClick={() => onItem(item.id)}>Open full disposal guide</button>
        </> : matches.options.length ? <>
          <h2>Which item do you have?</h2>
          <div className="cats disposal-filters journey-options">{matches.options.map(option =>
            <button className="chip" key={option.id} onClick={() => { setQ(option.name); setChosen(option); focusResult() }}>{option.name}</button>)}</div>
        </> : <p role="status">{answer?.loading ? 'Looking for guidance…' : <>
          {answer ? (answer.unavailable ? 'Item lookup is unavailable.' : 'No matching guide was found for this description.') : 'Press Find out to search by description.'}
          {' '}<a href={officialGuide} target="_blank" rel="noreferrer">Look up an item with DSNY</a>.
        </>}</p>}
      </section>}

      <h2 className="h2">Everything in one place</h2>
      <section className="tiles">
        {TILES.map(([id, title, desc, Icon, color]) => (
          <button key={id} className="tile" style={{ '--c': color }} onClick={() => onTab(id)}>
            <span className="ic"><Icon size={24} aria-hidden="true" /></span>
            <b>{title}</b>
            <span>{desc}</span>
          </button>
        ))}
      </section>

      <h2 className="h2">The bins, in color</h2>
      <div className="legend">
        {BINS.map(k => <span key={k} className="lg"><i style={{ background: STREAMS[k].color }} />{STREAMS[k].name}</span>)}
      </div>
    </>
  )
}
