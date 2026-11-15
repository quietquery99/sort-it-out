import { useState } from 'react'
import { STREAMS } from '../data/streams'
import { ITEMS } from '../data/items'

const PILLS = ['Lithium batteries', 'Greasy pizza box', 'Old sneakers', 'Air conditioner', 'Latex paint', 'Laptop or phone']

export default function Sort({ onFindOnMap }) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState(null)

  const q = query.trim().toLowerCase()
  const matches = q ? ITEMS.filter(i => (i.name + ' ' + i.keywords).toLowerCase().includes(q)).slice(0, 5) : []
  const choose = item => { setPicked(item); setQuery(item.name) }
  const stream = picked && STREAMS[picked.stream]

  return (
    <section>
      <h1 className="hero">What are you throwing out?</h1>

      <div className="searchbox">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPicked(null) }}
          onKeyDown={e => e.key === 'Enter' && matches[0] && choose(matches[0])}
          placeholder="Try “pizza box” or “batteries”"
          aria-label="Search for an item"
        />
        {q && !picked && (
          <div className="suggest">
            {matches.length ? matches.map(m => (
              <button key={m.name} onClick={() => choose(m)}>
                <span className="dot" style={{ background: STREAMS[m.stream].color }} />
                {m.name}
                <span className="muted">{STREAMS[m.stream].name}</span>
              </button>
            )) : (
              <p className="muted pad">
                No match yet. Try DSNY’s{' '}
                <a href="https://www.nyc.gov/site/dsny/collection/get-rid-of.page" target="_blank" rel="noreferrer">How to get rid of…</a>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pills">
        {PILLS.map(p => <button key={p} className="chip" onClick={() => choose(ITEMS.find(i => i.name === p))}>{p}</button>)}
      </div>

      {picked && (
        <article className="bin">
          <header className="lid" style={{ background: stream.color }}>
            <h2>{picked.name}</h2>
            <span>{stream.name}</span>
          </header>
          <div className="bin-body">
            <ol>{picked.steps.map(s => <li key={s}>{s}</li>)}</ol>
            <p className="impact" style={{ borderColor: stream.color }}><b>Why it matters.</b> {picked.impact}</p>
            {picked.layer
              ? <button className="btn primary" onClick={() => onFindOnMap(picked.layer)}>Find nearest drop-off on the map</button>
              : picked.link && <a className="btn primary" href={picked.link.href} target="_blank" rel="noreferrer">{picked.link.label}</a>}
          </div>
        </article>
      )}
      <p className="muted" style={{ marginTop: 28, maxWidth: 640 }}>
        Residential waste only. Always confirm on DSNY’s “How to get rid of…” page before disposing.
      </p>
    </section>
  )
}