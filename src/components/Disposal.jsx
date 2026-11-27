import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles, X, MapPin, ExternalLink, BookOpen } from 'lucide-react'
import { ITEMS, CATEGORIES } from '../data/items'
import { STREAMS } from '../data/streams'
import { TIPS, KINDS } from '../data/reuse'
import { GUIDES } from '../data/guides'

const DSNY = 'https://www.nyc.gov/site/dsny/collection/get-rid-of.page'
const hay = i => (i.name + ' ' + i.keywords).toLowerCase()

export default function Disposal({ initial, initialId, onTab, onMap, onGuide }) {
  const [q, setQ] = useState(initial || '')
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState(null)   // { item, why }
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  // The grid filters live as you type, and by category.
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return ITEMS.filter(i => (cat === 'All' || i.cat === cat) && (!t || hay(i).includes(t)))
  }, [q, cat])

  // Open an item in the pop-up. (Items with a guide get a "Before you throw it..." button there.)
  function show(item, why = '') {
    setOpen({ item, why })
  }

  // Ask the Cloudflare AI to match messy text to one rule in our rule book.
  async function ask(text) {
    const s = text.trim()
    if (s.length < 2) return
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: s }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error('AI unavailable')
      const item = ITEMS.find(i => i.id === d.id)
      if (item) show(item, d.why)
      else setMsg(`We couldn’t find a confident match for “${s}”. Try different words or check DSNY’s official guide.`)
    } catch {
      // Backup if the AI is down: simple word matching.
      const words = s.toLowerCase().split(/\s+/).filter(w => w.length > 2)
      const item = ITEMS.find(i => words.some(w => hay(i).includes(w)))
      if (item) show(item)
      else setMsg(`No match for “${s}”. Try different words or check DSNY’s official guide.`)
    }
    setBusy(false)
  }

  // Arrived from the Home search: ask the AI right away.
  useEffect(() => { if (initial) ask(initial) }, []) // eslint-disable-line

  // Opened from Sorty: show that rule straight away.
  useEffect(() => {
    if (!initialId) return
    const it = ITEMS.find(i => i.id === initialId)
    if (it) show(it)
  }, []) // eslint-disable-line

  // Escape closes the pop-up.
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const s = open && STREAMS[open.item.stream]
  // Reuse/repair tips for the open item, or undefined if reuse.js has none for it.
  const tips = open && TIPS[open.item.id]

  return (
    <section>
      <h1 className="page-h">Where does it go?</h1>
      <p className="muted">Type anything, even messy: “my kid’s swollen tablet battery”. Press the AI button and we’ll find the right rule.</p>

      <form className="dsearch" onSubmit={e => { e.preventDefault(); ask(q) }}>
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${ITEMS.length} items`} aria-label="Search items" />
        <button className="ai-btn" disabled={busy || q.trim().length < 2}><Sparkles size={16} aria-hidden="true" />{busy ? 'Thinking…' : 'Ask AI'}</button>
      </form>

      <div className="cats">
        {['All', ...CATEGORIES].map(c => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      {msg && <p className="note">{msg} <a href={DSNY} target="_blank" rel="noreferrer">DSNY: How to get rid of…</a></p>}

      <div className="dgrid">
        {list.map(i => (
          <button key={i.id} className="icard" style={{ '--c': STREAMS[i.stream].color }} onClick={() => show(i)}>
            <b>{i.name}</b>
            <span className="stream"><i />{STREAMS[i.stream].name}</span>
          </button>
        ))}
      </div>
      {!list.length && <p className="muted">Nothing matches the filter. Press <b>Ask AI</b> to match it by meaning.</p>}
      <p className="muted small" style={{ marginTop: 24 }}>Residential waste only. Always confirm on DSNY’s official guide before disposing.</p>

      {open && (
        <div className="overlay" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={open.item.name} onClick={e => e.stopPropagation()} style={{ '--c': s.color }}>
            <header className="lid" style={{ background: s.color }}>
              <h2>{open.item.name}</h2>
              <span>{s.name}</span>
              <button className="x" onClick={() => setOpen(null)} aria-label="Close"><X size={18} /></button>
            </header>
            <div className="body">
              {open.why && <p className="why"><Sparkles size={14} aria-hidden="true" /> AI match: {open.why}</p>}
              <ol>{open.item.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
              {tips && (
                <div className="tips">
                  <h3>Before you toss it</h3>
                  <ul>
                    {tips.map((t, k) => (
                      <li key={k}><span className="tip-kind">{KINDS[t.kind]}</span>{t.text}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="impact"><b>Why it matters.</b> {open.item.impact}</p>
              <div className="actions">
                {/* Only items listed in guides.js have a guide page. */}
                {GUIDES[open.item.id] && <button className="btn primary" onClick={() => onGuide(open.item.id)}><BookOpen size={16} aria-hidden="true" />Before you throw it...</button>}
                {open.item.link && <a className="btn primary" href={open.item.link.href} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />{open.item.link.label}</a>}
                {open.item.layer && <button className="btn primary" onClick={() => onMap(open.item.layer)}><MapPin size={16} aria-hidden="true" />Find nearest drop-off</button>}
                <a className="btn" href={DSNY} target="_blank" rel="noreferrer">DSNY guide</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}