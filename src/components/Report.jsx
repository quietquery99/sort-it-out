import { useState } from 'react'
import { Copy, ExternalLink, LocateFixed } from 'lucide-react'
import { locate } from '../lib/geo'

// [id, label, plain description]
const TYPES = [
  ['basket', 'Overflowing litter basket', 'The litter basket is overflowing'],
  ['dump', 'Illegal dumping', 'Items have been dumped on the street or sidewalk'],
  ['missed', 'Missed pickup', 'Scheduled collection did not happen'],
  ['dirty', 'Dirty sidewalk or street', 'There is trash or debris on the sidewalk or street'],
]

export default function Report() {
  const [type, setType] = useState('basket')
  const [where, setWhere] = useState('')
  const [details, setDetails] = useState('')
  const [msg, setMsg] = useState('')

  const t = TYPES.find(x => x[0] === type)
  const summary = [
    'Sanitation report draft (from SortItOut)',
    `Issue: ${t[1]}. ${t[2]}.`,
    `Where: ${where || '(add the address or cross streets)'}`,
    `Noticed: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
    details ? `Details: ${details}` : '',
  ].filter(Boolean).join('\n')

  async function copy() {
    try { await navigator.clipboard.writeText(summary); setMsg('Copied. Paste it into the 311 form.') }
    catch { setMsg('Could not copy automatically. Select the text above and copy it.') }
  }
  const useLocation = () => {
    setMsg('Finding you…')
    locate(([la, ln]) => { setWhere(`Near my location: https://www.google.com/maps?q=${la.toFixed(5)},${ln.toFixed(5)}`); setMsg('') }, setMsg)
  }

  return (
    <section>
      <h1 className="page-h">Report a problem</h1>
      <p className="muted">Pick what you see. We’ll write a clear report you can paste into 311, which is the city’s official way to file it.</p>

      <div className="rgrid" role="radiogroup" aria-label="Type of problem">
        {TYPES.map(([id, label]) => (
          <button key={id} role="radio" aria-checked={type === id} className={'rbtn' + (type === id ? ' on' : '')} onClick={() => setType(id)}>{label}</button>
        ))}
      </div>

      <div className="two" style={{ marginTop: 14 }}>
        <label className="field">Where is it?
          <input className="input" value={where} onChange={e => setWhere(e.target.value)} placeholder="Address or cross streets" />
        </label>
        <label className="field">Anything else we should say?
          <input className="input" value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. been like this for 3 days" />
        </label>
      </div>
      <button className="btn" style={{ marginTop: 10 }} onClick={useLocation}><LocateFixed size={16} aria-hidden="true" />Use my location</button>

      <pre className="draft">{summary}</pre>
      <div className="actions">
        <button className="btn" onClick={copy}><Copy size={16} aria-hidden="true" />Copy report</button>
        <a className="btn primary" href="https://portal.311.nyc.gov/" target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />Open 311</a>
      </div>
      {msg && <p className="muted small" role="status">{msg}</p>}
      <p className="muted small" style={{ marginTop: 14 }}>Tip: a photo and the exact location help crews respond faster. You can also call 311.</p>
    </section>
  )
}