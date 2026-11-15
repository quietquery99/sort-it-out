import { useState } from 'react'
import { DISTRICTS } from '../data/districts'

const LANGUAGES = ['English', 'Spanish', 'Chinese', 'Russian', 'Bengali', 'Haitian Creole', 'Yiddish']

export default function Briefs() {
  const [districtId, setDistrictId] = useState(DISTRICTS[0].id)
  const [language, setLanguage] = useState('Spanish')
  const [state, setState] = useState({ status: 'idle' })
  const [approved, setApproved] = useState(false)

  async function generate() {
    setState({ status: 'loading' }); setApproved(false)
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtId, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setState({ status: 'done', data })
    } catch (e) { setState({ status: 'error', message: e.message }) }
  }

  const d = state.data
  return (
    <section>
      <h1 style={{ fontSize: 36 }}>District brief &amp; resident mailer</h1>
      <p className="muted">The AI is given only our verified district figures and told not to invent anything. Staff approve before anything is shared.</p>
      <div className="bar noprint" style={{ marginTop: 12 }}>
        <select className="mini" value={districtId} onChange={e => setDistrictId(e.target.value)} aria-label="District">
          {DISTRICTS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="mini" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Language">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="btn primary" onClick={generate} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Generating…' : 'Generate'}
        </button>
        {d && <button className="btn" onClick={() => window.print()}>Print</button>}
      </div>

      {state.status === 'error' && <p className="warn">{state.message}</p>}

      {d && (
        <div className="sheet">
          <span className={'badge' + (approved ? ' ok' : '')}>{approved ? '✓ Verified by DSNY/SortItOut staff' : 'Pending DSNY/SortItOut staff review'}</span>{' '}
          {!approved && <button className="btn noprint" onClick={() => setApproved(true)}>Staff: approve</button>}
          <h2 style={{ marginTop: 14 }}>{d.facts.name}: waste &amp; outreach brief</h2>
          <h3>Key figures (illustrative data)</h3>
          <p>Diversion rate {d.facts.diversion}% (citywide potential 75%). About {d.facts.refuse} lbs of refuse per household each week. Largest 311 category: {d.facts.topComplaint} ({d.facts.topShare}% of complaints).</p>
          <h3>Summary · {d.language}</h3>
          <p dir={d.rtl ? 'rtl' : 'ltr'}>{d.summary}</p>
          <h3>Resident pamphlet · {d.language}</h3>
          <div dir={d.rtl ? 'rtl' : 'ltr'} style={{ border: '2px solid #23904F', borderRadius: 12, padding: 18 }}>
            <h2>{d.pamphlet[0]}</h2>
            <ul>{d.pamphlet.slice(1).map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
          <p style={{ fontSize: 13, color: '#555' }}>
            Drafted by AI from DSNY-based district figures. Machine translation must be reviewed by a native speaker before distribution.
          </p>
        </div>
      )}
    </section>
  )
}