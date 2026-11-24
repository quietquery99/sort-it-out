import { useState } from 'react'
import { Search, Trash2, Gift, MapPin, CalendarDays, Flag, BookOpen, Mic } from 'lucide-react'
import Scene from './Scene'
import { SortyArt } from './Sorty'
import { STREAMS } from '../data/streams'

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

export default function Home({ onSearch, onTab, onSorty }) {
  const [q, setQ] = useState('')
  const submit = e => { e.preventDefault(); if (q.trim()) onSearch(q.trim()) }

  return (
    <>
      <section className="hero">
        <Scene />
        <div className="hero-in">
          <p className="eyebrow">NYC residential waste, sorted</p>
          <h1>What are you throwing out?</h1>
          <p className="sub">Rules, drop-off places, and pickup days for your block, all in one spot.</p>
          <form className="search" onSubmit={submit}>
            <Search size={20} aria-hidden="true" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Try “old fridge” or “pizza box”" aria-label="Describe the item" />
            <button type="submit">Find out</button>
          </form>
          <div className="ideas">
            {IDEAS.map(x => <button key={x} className="chip" onClick={() => onSearch(x)}>{x}</button>)}
          </div>
        </div>

        <div className="perch">
          <div className="bubble"><Mic size={14} aria-hidden="true" /> Tap me and ask out loud!</div>
          <button className="sorty-hero" onClick={onSorty} aria-label="Talk to Sorty the pigeon"><SortyArt size={92} /></button>
          <div className="ledge" />
        </div>
      </section>

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