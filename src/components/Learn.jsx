import { useState } from 'react'
import { ITEMS } from '../data/items'
import { STREAMS } from '../data/streams'
import { DISTRICTS, COMPLAINT_TYPES } from '../data/districts'

/* ---------------- Quick Disposal Check (the game) ---------------- */
const MAIN = ['org', 'mgp', 'pap', 'ecy', 'don', 'safe']
const SKIP = new Set(['fridge', 'ac', 'smallapp', 'bike', 'sharps'])   // answers that need more than one bin
const POOL = ITEMS.filter(i => MAIN.includes(i.stream) && !SKIP.has(i.id))
const shuffle = a => [...a].sort(() => Math.random() - 0.5)
const makeRound = () => shuffle(POOL).slice(0, 6).map(item => ({
  item,
  options: shuffle([item.stream, ...shuffle(MAIN.filter(k => k !== item.stream)).slice(0, 3)]),
}))

function Quiz() {
  const [round, setRound] = useState(makeRound)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [score, setScore] = useState(0)
  const q = round[i]

  const choose = k => { if (pick) return; setPick(k); if (k === q.item.stream) setScore(s => s + 1) }
  const again = () => { setRound(makeRound()); setI(0); setPick(null); setScore(0) }

  if (i >= round.length) return (
    <div className="vcard" style={{ '--c': '#0E8F8F' }}>
      <b style={{ fontSize: 24 }}>You got {score} of {round.length}</b>
      <span className="muted">{score >= 5 ? 'Sorting pro!' : 'Look up anything you missed in the Disposal tab.'}</span>
      <button className="btn primary" onClick={again}>Play again</button>
    </div>
  )

  return (
    <div className="vcard" style={{ '--c': '#0E8F8F' }}>
      <span className="muted small">Question {i + 1} of {round.length}</span>
      <b style={{ fontSize: 22 }}>Where does “{q.item.name}” go?</b>
      {q.options.map(k => {
        const state = pick ? (k === q.item.stream ? 'right' : k === pick ? 'wrong' : '') : ''
        return (
          <button key={k} className={'opt ' + state} onClick={() => choose(k)}>
            <span className="cdot" style={{ background: STREAMS[k].color }} />{STREAMS[k].name}
          </button>
        )
      })}
      {pick && (
        <>
          <p className="impact" style={{ margin: 0, '--c': STREAMS[q.item.stream].color }}>
            <b>{pick === q.item.stream ? 'Correct! ' : 'Not quite. '}</b>{q.item.steps[0]} {q.item.impact}
          </p>
          <button className="btn primary" onClick={() => { setPick(null); setI(i + 1) }}>Next</button>
        </>
      )}
    </div>
  )
}

/* ---------------- Short guides ---------------- */
const GUIDES = [
  ['Brown bin basics', 'All food scraps go in: fruit, vegetables, meat, bones, dairy, coffee grounds. So do food-soiled paper like pizza boxes and napkins, and yard waste. Keep plastic bags out. Use a lidded bin to keep pests away.'],
  ['Why batteries start fires', 'Lithium-ion batteries (e-bikes, power banks, laptops, vapes) can spark when crushed in a garbage truck. Never put them in trash or recycling. Tape the terminals and bring them to a SAFE event or a store take-back.'],
  ['Blue and green bins', 'Blue is for metal, glass and plastic. Green is for paper and cardboard. Rinse containers, keep paper dry, and put everything in loose, not in bags.'],
  ['Reuse before you recycle', 'Furniture, clothes, books and working appliances can have a second life. Donate or repair first. It saves more resources than recycling does.'],
]

/* ---------------- Your district in three numbers ---------------- */
function District() {
  const [id, setId] = useState(DISTRICTS[0].id)
  const d = DISTRICTS.find(x => x.id === id)
  const top = d.complaints.indexOf(Math.max(...d.complaints))
  return (
    <>
      <select className="input" style={{ maxWidth: 420 }} value={id} onChange={e => setId(e.target.value)} aria-label="Community district">
        {DISTRICTS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <div className="big3">
        <div className="vcard" style={{ '--c': '#23904F' }}><span className="num">{d.diversion}%</span><span>of waste is kept out of landfills. The city could reach 75%.</span></div>
        <div className="vcard" style={{ '--c': '#7A4A27' }}><span className="num">{d.refuse} lbs</span><span>of trash per household each week.</span></div>
        <div className="vcard" style={{ '--c': '#B26A00' }}><span className="num">{d.complaints[top]}%</span><span>of 311 sanitation complaints here are about {COMPLAINT_TYPES[top]}.</span></div>
      </div>
      <p className="warn">Illustrative placeholder numbers. They’ll be replaced with DSNY and 311 data.</p>
    </>
  )
}

export default function Learn() {
  return (
    <section>
      <h1 className="page-h">Learn</h1>
      <p className="muted">Short guides, a quick game, and what’s going on in your district.</p>

      <h2 className="h2">Quick Disposal Check</h2>
      <div style={{ maxWidth: 560 }}><Quiz /></div>

      <h2 className="h2">Guides</h2>
      <div className="guides">
        {GUIDES.map(([title, body]) => (
          <details key={title}><summary>{title}</summary><p>{body}</p></details>
        ))}
      </div>

      <h2 className="h2">Your district in three numbers</h2>
      <District />
    </section>
  )
}