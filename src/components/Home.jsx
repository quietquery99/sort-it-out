import { useMemo, useRef, useState } from 'react'
import { Search, Trash2, Gift, MapPin, CalendarDays, Flag, BookOpen, Mic } from 'lucide-react'
import Scene from './Scene'
import { SortyArt } from './Sorty'
import { ITEMS } from '../data/items'
import { LAYERS } from '../data/layers'
import { STREAMS } from '../data/streams'
import { catalog, guidePreview, journeyMatches, officialGuide } from '../data/disposal'
import { Rule } from './DisposalCatalog'

const legacyItems = ITEMS.map(item => ({ ...item, aliases: item.keywords.split(' ') }))
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
  const journey = catalog.items.length > 0
  const matches = useMemo(() => journeyMatches(q, journey ? catalog.items : legacyItems), [q, journey])
  const item = chosen || matches.item
  const focusResult = () => requestAnimationFrame(() => result.current?.focus())
  const search = value => {
    if (!value.trim()) return
    if (!journey) { onSearch(value); return }
    setQ(value)
    setChosen(null)
    focusResult()
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
            <input value={q} onChange={e => { setQ(e.target.value); setChosen(null) }} placeholder="Try laptop, coffee cup, or batteries" aria-label="Describe the item" />
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
        {item && !journey ? <>
          <h2>{item.name}</h2>
          <p>{item.cat} · {STREAMS[item.stream].name}</p>
          <ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol>
          {item.layer && <p>No item-specific location is verified here. Directory category: {LAYERS[item.layer]?.name}.</p>}
          <a href={officialGuide} target="_blank" rel="noreferrer">View DSNY guide</a>
        </> : item ? <>
          <h2>{item.name}</h2>
          <p className="muted">{item.category} · {item.subcategory}{item.material && ' · ' + item.material}</p>
          {guidePreview && <p className="small muted">Preview guidance. Confirm conditions with the linked sources.</p>}
          {item.rules.map(rule => <Rule journey key={rule.id} item={item} rule={rule} onMap={onMap} />)}
          {item.rules.some(rule => rule.method === "Donate" && rule.status !== "prohibited") && <p className="small"><a href="https://www.nyc.gov/assets/donate/site/home" target="_blank" rel="noreferrer">Search donateNYC for reuse or repair services</a> · Confirm the item and service with the organization.</p>}
          <button className="btn" onClick={() => onItem(item.id)}>Open full disposal guide</button>
        </> : matches.options.length ? <>
          <h2>Which item do you have?</h2>
          <div className="cats disposal-filters journey-options">{matches.options.map(option =>
            <button className="chip" key={option.id} onClick={() => { setQ(option.name); setChosen(option); focusResult() }}>{option.name}</button>)}</div>
        </> : <p>No matching item. Try a shorter name or <a href={officialGuide} target="_blank" rel="noreferrer">check the DSNY guide</a>.</p>}
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
