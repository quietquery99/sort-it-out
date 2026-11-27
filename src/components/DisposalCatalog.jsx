import { useEffect, useMemo, useState } from 'react'
import { Armchair, BatteryCharging, ExternalLink, Leaf, MapPin, Monitor, Recycle, Refrigerator, Search, Trash2, X } from 'lucide-react'
import { STREAMS } from '../data/streams'
import { GUIDES } from '../data/guides'
import { TIPS } from '../data/reuse'
import { guideItems, groupItems, guidePreview, itemsById, matchingFacilities, officialGuide, searchItems } from '../data/disposal'

const categoryStyles = {
  Electronics: ['#7B3FE4', Monitor],
  'Special waste': ['#B26A00', BatteryCharging],
  Appliances: ['#4B6584', Refrigerator],
  'Household goods': ['#C42675', Armchair],
  Recyclables: ['#23904F', Recycle],
  'Food and yard': ['#7A4A27', Leaf],
  'Other waste': ['#5F6B76', Trash2],
}

export function OfficialLink({ url, children }) {
  return <a className="btn" href={url} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />{children}</a>
}

export function sourceLabel(url) {
  const host = new URL(url).hostname
  if (host === 'portal.311.nyc.gov') return 'View NYC311 Guide'
  if (new URL(url).pathname.startsWith('/site/dsny/')) return 'View DSNY Guide'
  return 'View Official Guide'
}

function Rule({ item, rule, onMap }) {
  const prohibited = rule.status === 'prohibited'
  const facilities = matchingFacilities(item.id, rule.id)
  return (
    <details className="disposal-rule">
      <summary><b>{rule.method}</b> <span className={prohibited ? 'disposal-warning' : 'muted'}>{prohibited ? '⚠ ' : ''}{rule.status}</span></summary>
      <dl>
        {Object.entries(rule.details).map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="actions">
        {rule.sources.map(([url, section]) => <OfficialLink key={url} url={url}>{sourceLabel(url)}{section && ` · ${section}`}</OfficialLink>)}
        {!prohibited && rule.collection && <OfficialLink url={rule.collection[1]}>{rule.collection[0]}</OfficialLink>}
        {!prohibited && facilities.length > 0 && <button className="btn primary" onClick={() => onMap({ itemId: item.id, ruleId: rule.id })}><MapPin size={16} aria-hidden="true" />Find nearby facilities</button>}
      </div>
      {!prohibited && (rule.facilityType || rule.method === 'Donate') && !facilities.length && <p className="muted small">No verified facility is listed for this rule. Check the official guidance for options.</p>}
      {rule.reviewed && <p className="muted small">Source review date {rule.reviewed}</p>}
    </details>
  )
}

export default function DisposalCatalog({ initial, initialId, onMap, onItemUrl, onGuide }) {
  const [q, setQ] = useState(initial || '')
  const [category, setCategory] = useState(itemsById.get(initialId)?.category || '')
  const [subcategory, setSubcategory] = useState(itemsById.get(initialId)?.subcategory || '')
  const [open, setOpen] = useState(() => itemsById.get(initialId) || null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const counts = useMemo(() => groupItems(guideItems), [])
  const matches = useMemo(() => searchItems(guideItems, q), [q])
  const subcategories = groupItems(matches).get(category)
  const categoryItems = category ? [...(subcategories?.values() || [])].flat() : matches
  const visible = subcategory ? subcategories?.get(subcategory) || [] : categoryItems

  function filterCategory(name) {
    setCategory(name)
    setSubcategory('')
    setMessage('')
  }

  function select(item) {
    setOpen(item)
    onItemUrl(item.id)
  }

  function close() {
    setOpen(null)
    onItemUrl(null)
  }

  useEffect(() => {
    if (!open) return
    const escape = event => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open, onItemUrl])

  async function ask(event) {
    event.preventDefault()
    if (visible.length === 1) { select(visible[0]); return }
    if (visible.length > 1) { setMessage('Choose the item that matches what you have.'); return }
    if (guidePreview) { setMessage('Try a shorter item name or check the official DSNY guide.'); return }
    setBusy(true)
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, catalog: 'guide' }) })
      if (!response.ok) throw new Error('Lookup unavailable')
      const { id } = await response.json()
      const match = itemsById.get(id)
      if (match) setMessage(`Try searching for “${match.name}”.`)
      else setMessage('Try a shorter item name or check the official DSNY guide.')
    } catch {
      setMessage('Try a shorter item name or check the official DSNY guide.')
    } finally { setBusy(false) }
  }

  return (
    <section className="disposal-page">
      <h1 className="page-h">Where does it go?</h1>
      <p className="muted">Search for an item or browse by category to see its disposal rules.</p>
      <form className="dsearch" onSubmit={ask}>
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={event => { setQ(event.target.value); filterCategory('') }} placeholder={`Search ${guideItems.length} items`} aria-label="Search items" />
        <button className="ai-btn" disabled={busy || q.trim().length < 2}><Search size={16} aria-hidden="true" />{busy ? 'Searching…' : 'Find item'}</button>
      </form>
      <div className="filter-caption"><strong>Main category</strong><span>Choose the group your item belongs to.</span></div>
      <div className="cats disposal-filters" role="group" aria-label="Filter by category">
        <button className={'chip' + (!category ? ' on' : '')} aria-pressed={!category} onClick={() => filterCategory('')}>All ({guideItems.length})</button>
        {[...counts].map(([name, groups]) => {
          const [color, Icon] = categoryStyles[name] || categoryStyles['Other waste']
          return (
          <button key={name} className={'chip' + (category === name ? ' on' : '')} aria-pressed={category === name} onClick={() => filterCategory(name)}>
            <Icon size={16} className="filter-icon" color={category === name ? 'currentColor' : color} aria-hidden="true" />{name} ({[...groups.values()].flat().length})
          </button>
          )
        })}
      </div>
      {category && subcategories?.size > 0 && (
        <>
        <div className="filter-caption"><strong>Subcategory</strong><span>Narrow the items within {category.toLowerCase()}.</span></div>
        <div className="cats disposal-filters" role="group" aria-label="Filter by subcategory">
          <button className={'chip' + (!subcategory ? ' on' : '')} aria-pressed={!subcategory} onClick={() => setSubcategory('')}>All {category.toLowerCase()} ({categoryItems.length})</button>
          {[...subcategories].map(([name, items]) => (
            <button key={name} className={'chip' + (subcategory === name ? ' on' : '')} aria-pressed={subcategory === name} onClick={() => { setSubcategory(name); setMessage('') }}>
              {name} ({items.length})
            </button>
          ))}
        </div></>
      )}
      {message && <p className="note" role="status">{message}</p>}
      <div className="dgrid disposal-cards">
        {visible.map(item => {
          const [color, Icon] = categoryStyles[item.category] || categoryStyles['Other waste']
          return (
            <button key={item.id} className="icard" style={{ '--c': color }} onClick={() => select(item)}>
              <span className="disposal-card-icon"><Icon size={19} aria-hidden="true" /></span>
              <b>{item.name}</b>
              <span className="muted small">{item.subcategory}</span>
              <span className="stream"><i />{item.rules ? item.rules.length + (item.rules.length === 1 ? ' rule' : ' rules') : STREAMS[item.stream].name}</span>
            </button>
          )
        })}
      </div>
      {!visible.length && <p className="muted">No items match. <a href={officialGuide} target="_blank" rel="noreferrer">View the official DSNY guide</a>.</p>}
      {open && (
        <div className="overlay" onClick={close}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={open.name} onClick={event => event.stopPropagation()}>
            <header className="lid" style={{ background: (categoryStyles[open.category] || categoryStyles['Other waste'])[0] }}>
              <h2>{open.name}</h2><span>{open.category} · {open.subcategory}</span>
              <button className="x" onClick={close} aria-label="Close" ref={button => button?.focus()}><X size={18} /></button>
            </header>
            <div className="body">
              {open.material && <p className="muted small">DSNY material classification: {open.material}</p>}
              {open.rules?.map(rule => <Rule key={rule.id} item={open} rule={rule} onMap={onMap} />)}
              {open.steps && <details className="disposal-rule">
                <summary><b>{open.rules ? 'Item preparation and guidance' : STREAMS[open.stream].name}</b></summary>
                <ol>{open.steps.map(step => <li key={step}>{step}</li>)}</ol>
                {TIPS[open.id]?.filter(tip => tip.text !== 'TO WRITE').map(tip => <p key={tip.text}>{tip.text}</p>)}
                {open.impact && <p>{open.impact}</p>}
                <div className="actions">
                  <OfficialLink url={open.source || officialGuide}>View DSNY Guide</OfficialLink>
                  {open.link && <OfficialLink url={open.link.href}>{open.link.label}</OfficialLink>}
                  {open.layer && !open.rules && <button className="btn" onClick={() => onMap(open.layer)}>Browse location directory</button>}
                  {GUIDES[open.id] && <button className="btn" onClick={() => onGuide(open.id)}>Before you throw it…</button>}
                </div>
              </details>}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
