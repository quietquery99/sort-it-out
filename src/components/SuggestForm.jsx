import { useState } from 'react'

const EMPTY = { kind: 'New drop-off location', name: '', address: '', details: '', website: '' }

export default function SuggestForm({ onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = key => e => setForm({ ...form, [key]: e.target.value })

  async function submit() {
    if (!form.name.trim()) { setMsg('Please add a name so reviewers know what to check.'); return }
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send')
      setMsg('Thank you! Your suggestion is pending DSNY/staff verification.')
      setForm(EMPTY)
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  return (
    <aside className="drawer" aria-label="Suggest a place or fix">
      <h2>Suggest a place or fix</h2>
      <p className="muted">Nothing appears on the public map until staff verify it.</p>

      <label htmlFor="kind">What is it?</label>
      <select id="kind" className="input" value={form.kind} onChange={set('kind')}>
        <option>New drop-off location</option>
        <option>Outdated hours</option>
        <option>Recycling or swap event</option>
      </select>
      <label htmlFor="nm">Name</label>
      <input id="nm" className="input" value={form.name} onChange={set('name')} />
      <label htmlFor="ad">Address</label>
      <input id="ad" className="input" value={form.address} onChange={set('address')} />
      <label htmlFor="dt">Details</label>
      <textarea id="dt" className="input" rows={3} value={form.details} onChange={set('details')} />
      {/* Honeypot: real people never see this. Bots fill it in and get ignored. */}
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Send for review'}</button>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      {msg && <p role="status">{msg}</p>}
    </aside>
  )
}