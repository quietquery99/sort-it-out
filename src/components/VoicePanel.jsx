import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Volume2, VolumeX, Send, X } from 'lucide-react'
import { SortyArt } from './Sorty'
import { ITEMS } from '../data/items'

// [language name, speech code]. An empty code means browsers don't offer speech for it.
const LANGS = [['English', 'en-US'], ['Spanish', 'es-ES'], ['Chinese', 'zh-CN'], ['Russian', 'ru-RU'], ['Bengali', 'bn-IN'], ['Haitian Creole', ''], ['Yiddish', '']]
const EXAMPLES = ['Can I put my old fridge on the curb?', 'Where do batteries go?', 'Is a pizza box compostable?']
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// Find a voice on this device for the language (null if none).
function findVoice(code) {
  if (!code || !('speechSynthesis' in window)) return null
  const pre = code.slice(0, 2).toLowerCase()
  return window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith(pre)) || null
}
// Speak text aloud. Returns false if this device has no voice for the language.
function speak(text, code) {
  const v = findVoice(code)
  if (!v) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = v; u.lang = v.lang
  window.speechSynthesis.speak(u)
  return true
}

export default function VoicePanel({ onClose, onOpenItem }) {
  const [lang, setLang] = useState('English')
  const [log, setLog] = useState([{ who: 'bot', text: 'Coo! I’m Sorty. Tap the mic and ask where something goes, or type below.' }])
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [speakOn, setSpeakOn] = useState(true)
  const [note, setNote] = useState('')
  const rec = useRef(null), endRef = useRef(null)
  const code = LANGS.find(l => l[0] === lang)[1]

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [log, busy])
  // Browsers load their voice list a moment after the page opens; ask for it early.
  useEffect(() => {
    const s = window.speechSynthesis
    if (!s) return
    const f = () => s.getVoices()
    f(); s.addEventListener('voiceschanged', f)
    return () => { s.removeEventListener('voiceschanged', f); s.cancel(); rec.current?.abort?.() }
  }, [])

  async function ask(q) {
    const s = q.trim()
    if (!s || busy) return
    window.speechSynthesis?.cancel(); setNote(''); setText('')
    setLog(l => [...l, { who: 'you', text: s }]); setBusy(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: s, language: lang }) })
      const d = await res.json()
      if (!res.ok) throw new Error('AI unavailable')
      setLog(l => [...l, { who: 'bot', text: d.answer, ids: d.ids, rtl: d.rtl }])
      if (speakOn && !speak(d.answer, code))
        setNote(code ? 'This device has no voice for that language, so I’ll show the text only.' : 'Spoken replies aren’t available in this language yet. The text is above.')
    } catch {
      setLog(l => [...l, { who: 'bot', text: 'Sorry, I couldn’t answer just now. Try the Disposal tab.' }])
    }
    setBusy(false)
  }

  function listen() {
    if (!SR) { setNote('Voice input isn’t supported in this browser. Chrome, Edge and Safari work. You can type instead.'); return }
    if (!code) { setNote('Voice input isn’t available for this language. Please type your question.'); return }
    window.speechSynthesis?.cancel(); setNote('')
    const r = new SR()
    r.lang = code; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = e => ask(e.results[0][0].transcript)
    r.onerror = e => setNote(e.error === 'not-allowed' ? 'Microphone permission is blocked. Allow it in your browser settings.' : 'I didn’t catch that. Try again.')
    r.onend = () => setListening(false)
    rec.current = r
    try { r.start(); setListening(true) } catch { setListening(false) }
  }
  const stop = () => { rec.current?.stop(); setListening(false) }

  return (
    <aside className="vp" aria-label="Talk to Sorty">
      <div className="vp-head">
        <SortyArt size={34} /><b>Sorty</b><span className="sp" />
        <select className="vsel" value={lang} onChange={e => { window.speechSynthesis?.cancel(); setLang(e.target.value); setNote('') }} aria-label="Language">
          {LANGS.map(l => <option key={l[0]}>{l[0]}</option>)}
        </select>
        <button className="xbtn" onClick={() => { window.speechSynthesis?.cancel(); setSpeakOn(s => !s) }} aria-pressed={speakOn} aria-label={speakOn ? 'Mute spoken replies' : 'Turn on spoken replies'}>
          {speakOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button className="xbtn" onClick={onClose} aria-label="Close"><X size={17} /></button>
      </div>

      <div className="vp-log" aria-live="polite">
        {log.map((m, i) => (
          <div key={i} className={'msg ' + m.who} dir={m.rtl ? 'rtl' : 'ltr'}>
            {m.text}
            {m.who === 'bot' && i > 0 && (
              <span className="mact">
                <button onClick={() => { if (!speak(m.text, code)) setNote('No voice available for this language here.') }}>Replay</button>
                {m.ids?.map(id => <button key={id} onClick={() => onOpenItem(id)}>Open: {ITEMS.find(x => x.id === id)?.name}</button>)}
              </span>
            )}
          </div>
        ))}
        {busy && <div className="msg bot">Thinking…</div>}
        {log.length === 1 && <div className="vp-ex">{EXAMPLES.map(x => <button key={x} className="chip" onClick={() => ask(x)}>{x}</button>)}</div>}
        <div ref={endRef} />
      </div>

      {note && <p className="vp-note" role="status">{note}</p>}
      <form className="vp-foot" onSubmit={e => { e.preventDefault(); ask(text) }}>
        <button type="button" className={'mic' + (listening ? ' live' : '')} onClick={listening ? stop : listen} aria-label={listening ? 'Stop listening' : 'Start talking'}>
          {listening ? <Square size={20} /> : <Mic size={22} />}
        </button>
        <input className="vin" value={text} onChange={e => setText(e.target.value)} placeholder={listening ? 'Listening…' : 'Or type a question'} aria-label="Type a question" />
        <button className="xbtn send" aria-label="Send"><Send size={17} /></button>
      </form>
    </aside>
  )
}