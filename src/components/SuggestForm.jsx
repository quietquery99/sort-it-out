import { useState } from 'react'
import { X } from 'lucide-react'

const EMPTY = { kind: 'New drop-off location', name: '', address: '', details: '', website: '' }

// Lets residents and partners suggest a place or a correction. It goes to a staff review queue.
export default function SuggestForm({ onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  async function submit() {
    if (!form.name.trim()) { setMsg('Please add a name so reviewers know what to check.'); return }
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not send')
      setMsg('Thank you! Your suggestion is pending DSNY/staff verification.')
      setForm(EMPTY)
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Suggest a place or fix" onClick={e => e.stopPropagation()}>
        <div className="fhead">
          <h2>Suggest a place or fix</h2>
          <button className="xbtn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">
          <p className="muted small" style={{ margin: 0 }}>Nothing appears on the public map until staff verify it.</p>
          <label className="field">What is it?
            <select className="input" value={form.kind} onChange={set('kind')}>
              <option>New drop-off location</option><option>Outdated hours</option><option>Recycling or swap event</option>
            </select>
          </label>
          <label className="field">Name<input className="input" value={form.name} onChange={set('name')} /></label>
          <label className="field">Address<input className="input" value={form.address} onChange={set('address')} /></label>
          <label className="field">Details<textarea className="input" rows={3} value={form.details} onChange={set('details')} /></label>
          {/* Honeypot: real people never see this. Bots fill it in and get ignored. */}
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
          <div className="actions">
            <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Send for review'}</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
          {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
        </div>
      </div>
    </div>
  )
}