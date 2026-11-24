import { useState } from 'react'
import { Printer, Sparkles } from 'lucide-react'
import { DISTRICTS } from '../data/districts'
import { SITES } from '../data/sites'

const LANGUAGES = ['English', 'Spanish', 'Chinese', 'Russian', 'Bengali', 'Haitian Creole', 'Yiddish']
const BORO = { bk: 'Brooklyn', bx: 'Bronx', qn: 'Queens', mn: 'Manhattan' }

export default function Boards() {
  const [districtId, setDistrictId] = useState(DISTRICTS[0].id)
  const [language, setLanguage] = useState('Spanish')
  const [st, setSt] = useState({ status: 'idle' })
  const [approved, setApproved] = useState(false)

  async function generate() {
    setSt({ status: 'loading' }); setApproved(false)
    try {
      const res = await fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ districtId, language }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSt({ status: 'done', data })
    } catch (e) { setSt({ status: 'error', message: e.message }) }
  }

  const d = st.data
  const boro = BORO[districtId.slice(0, 2)]
  const partners = SITES.filter(s => s.borough === boro).slice(0, 6)   // resource list of nearby places

  return (
    <section>
      <h1 className="page-h">For community boards &amp; officials</h1>
      <p className="muted" style={{ maxWidth: 680 }}>Choose a district and a language. We generate a district brief and a resident pamphlet. The AI only sees our verified district figures and is told not to invent anything. Staff approve before anything is shared.</p>

      <div className="bar2 noprint" style={{ marginTop: 14 }}>
        <select className="minput" value={districtId} onChange={e => setDistrictId(e.target.value)} aria-label="District">
          {DISTRICTS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <select className="minput" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Language">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="btn primary" onClick={generate} disabled={st.status === 'loading'}><Sparkles size={16} aria-hidden="true" />{st.status === 'loading' ? 'Writing…' : 'Generate'}</button>
        {d && <button className="btn" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print / save PDF</button>}
      </div>
      {st.status === 'error' && <p className="warn">{st.message}</p>}

      {d && (
        <article className="doc">
          <span className={'badge' + (approved ? ' ok' : '')}>{approved ? '✓ Verified by DSNY/SortItOut staff' : 'Pending staff review'}</span>{' '}
          {!approved && <button className="btn noprint" onClick={() => setApproved(true)}>Staff: approve (demo)</button>}
          <h2 style={{ marginTop: 14 }}>{d.facts.name}</h2>
          <p style={{ margin: '2px 0 10px', color: '#555' }}>Waste characterization &amp; outreach brief</p>
          <div className="t3row">
            <div className="t3"><b>{d.facts.diversion}%</b>of waste diverted</div>
            <div className="t3"><b>{d.facts.refuse}</b>lbs refuse per household per week</div>
            <div className="t3"><b>{d.facts.topShare}%</b>of 311 complaints: {d.facts.topComplaint}</div>
          </div>
          <p style={{ fontSize: 12, color: '#777' }}>Illustrative data until replaced with DSNY and 311 figures.</p>

          <h3>Summary · {d.language}</h3>
          <p dir={d.rtl ? 'rtl' : 'ltr'}>{d.summary}</p>

          <h3>Resident pamphlet · {d.language}</h3>
          <div className="pamph" dir={d.rtl ? 'rtl' : 'ltr'}>
            <h2>{d.pamphlet[0]}</h2>
            <ul>{d.pamphlet.slice(1).map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>

          <h3>Nearby places to share ({boro})</h3>
          <ul>{partners.map(s => <li key={s.id}><b>{s.name}</b>, {s.hours}</li>)}</ul>

          <p style={{ fontSize: 12, color: '#777', marginTop: 16 }}>
            Drafted by AI from DSNY-based district figures. Machine translation must be reviewed by a native speaker before distribution.
          </p>
        </article>
      )}
    </section>
  )
}