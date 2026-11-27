import { items as publishedGuideItems } from '../src/data/disposal.published.json'
import { DISTRICTS, COMPLAINT_TYPES } from '../src/data/districts.js'
import { ITEMS } from '../src/data/items.js'
import { STREAMS } from '../src/data/streams.js'

const MODEL = '@cf/meta/llama-3.1-8b-instruct'
const LANGS = { English: 'en', Spanish: 'es', Chinese: 'zh', Russian: 'ru', Bengali: 'bn', 'Haitian Creole': 'ht', Yiddish: 'yi' }
const PAMPHLET = [
  'Sort it right',
  'Food scraps and yard waste go in the brown bin.',
  'Batteries never go in the trash or recycling. Take them to a SAFE site.',
  'Look up any item at SortItOut.',
]
const json = (data, status = 200) => Response.json(data, { status })

/* ---------------- translation helpers ---------------- */
// Translate between language codes; on any failure, return the original text.
async function tr(env, text, from, to) {
  if (from === to) return text
  try {
    const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang: from, target_lang: to })
    return r.translated_text || text
  } catch { return text }
}
const sentences = t => t.split(/(?<=[.!?])\s+/).filter(Boolean)
// The translation model works best one sentence at a time.
async function translateLong(env, text, lang) {
  if (lang === 'en') return text
  return (await Promise.all(sentences(text).map(s => tr(env, s, 'en', lang)))).join(' ')
}

/* ---------------- matching text to our rule book ---------------- */
// AI picks ONE catalog entry. It never writes rules itself.
async function matchOne(env, text, entries = ITEMS) {
  const catalog = entries.map(i => `${i.id}: ${i.name} (${i.keywords || i.aliases.join(', ')})`).join('\n')
  const ai = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: `You match what a New York City resident wants to throw away to exactly ONE entry in our catalog. Reply with JSON only: {"id":"<catalog id or none>","why":"<one short sentence, max 20 words>"}. Use "none" if nothing fits. Never add rules or facts.\n\nCatalog:\n${catalog}` },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_schema', json_schema: {
      type: 'object', properties: { id: { type: 'string', enum: [...entries.map(i => i.id), 'none'] }, why: { type: 'string' } },
      required: ['id', 'why'],
    } },
    max_tokens: 150, temperature: 0,
  })
  const m = String(ai.response || '').match(/\{[\s\S]*\}/)
  const p = typeof ai.response === 'object' && ai.response ? ai.response : m ? JSON.parse(m[0]) : {}
  return entries.some(i => i.id === p.id) ? { id: p.id, why: String(p.why || '').slice(0, 160) } : null
}

// Fast keyword search first (free and instant).
const STOP = new Set(['the','and','can','how','what','where','does','that','this','with','from','into','have','put','get','rid','out','throw','away','old','your','you','for','are','not','but','curb','is','it','my','do','on','in','to','of','or','an','at','be','go','goes','should','would','could','there','their','when','why','who','about','any','some','just','like','want','need'])
function keywordTop(text, n = 4) {
  const words = (text.toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter(w => w.length > 1 && !STOP.has(w))
    .map(w => (w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.endsWith('s') ? w.slice(0, -1) : w))
  if (!words.length) return []
  return ITEMS
    .map(i => {
      const h = (i.name + ' ' + i.keywords).toLowerCase(), nm = i.name.toLowerCase()
      return { i, s: words.reduce((a, w) => a + (h.includes(w) ? 1 : 0) + (nm.includes(w) ? 1 : 0), 0) }
    })
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.i)
}

/* ---------------- routes ---------------- */
// POST /api/ask: Disposal tab "Ask AI" button.
async function ask(request, env) {
  const { q, catalog } = await request.json().catch(() => ({}))
  const text = String(q || '').trim().slice(0, 200)
  if (text.length < 2) return json({ error: 'Type an item first.' }, 400)
  try {
    const r = await matchOne(env, text, catalog === 'guide' && publishedGuideItems.length ? publishedGuideItems : ITEMS)
    return json(r || { id: 'none', why: '' })
  } catch { return json({ error: 'AI unavailable' }, 502) }
}

// POST /api/chat: Sorty's voice brain. Answers ONLY from the rule book entries we hand it.
async function chat(request, env) {
  const { q, language } = await request.json().catch(() => ({}))
  const lang = LANGS[language] || 'en'
  const text = String(q || '').trim().slice(0, 300)
  if (text.length < 2) return json({ error: 'Ask a question first.' }, 400)

  const qEn = await tr(env, text, lang, 'en')     // understand questions in any language
  let items = keywordTop(qEn)
  if (!items.length) {                            // keyword search found nothing: let the AI pick
    try { const m = await matchOne(env, qEn); if (m) items = [ITEMS.find(i => i.id === m.id)] } catch { /* fall through */ }
  }

  let answerEn
  if (!items.length) {
    answerEn = 'I’m not sure about that one. Try the Disposal tab, check the DSNY website, or call 311.'
  } else {
    const context = items.map(i => `- ${i.name} [${STREAMS[i.stream].name}]: ${i.steps.join(' ')} Why it matters: ${i.impact}`).join('\n')
    try {
      const ai = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: 'You are Sorty, a friendly New York City pigeon who helps residents sort waste. Answer ONLY using the CONTEXT. Reply in at most 3 short sentences of plain spoken English: no lists, no emojis, no markdown. If the context does not answer the question, say you are not sure and suggest the DSNY website or 311. If the question is about pickup days, the map, donating, or reporting a problem, point to the Pickup, Map, Donate or Report tab. Never invent rules, dates, phone numbers or addresses.' },
          { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${qEn}` },
        ],
        max_tokens: 160, temperature: 0.2,
      })
      answerEn = String(ai.response || '').trim() || 'I’m not sure about that one. Try the Disposal tab.'
    } catch { return json({ error: 'AI unavailable' }, 502) }
  }
  const answer = await translateLong(env, answerEn, lang)
  return json({ answer, answerEn, ids: items.slice(0, 2).map(i => i.id), rtl: lang === 'yi' })
}

// POST /api/brief: facts come from our data; the AI writes 3 sentences from them; then we translate.
async function brief(request, env) {
  const { districtId, language } = await request.json().catch(() => ({}))
  const d = DISTRICTS.find(x => x.id === districtId), lang = LANGS[language]
  if (!d || !lang) return json({ error: 'Unknown district or language.' }, 400)
  const top = d.complaints.indexOf(Math.max(...d.complaints))
  const facts = { name: d.name, diversion: d.diversion, refuse: d.refuse, topComplaint: COMPLAINT_TYPES[top], topShare: d.complaints[top] }
  let en
  try {
    const ai = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: 'You write plain-language briefs for NYC Community Boards. Use ONLY the facts given. Never invent numbers, programs, places or dates. Write exactly 3 short sentences: what the numbers show, the main problem, one outreach suggestion.' },
        { role: 'user', content: `District: ${d.name}\nDiversion rate: ${d.diversion}% (citywide potential 75%)\nRefuse per household: ${d.refuse} lbs per week\nLargest 311 complaint: ${facts.topComplaint}, ${facts.topShare}%` },
      ], max_tokens: 220,
    })
    en = ai.response
  } catch { return json({ error: 'The AI service is not available right now. Run npx wrangler login and try again.' }, 502) }
  const summary = await translateLong(env, en, lang)
  const pamphlet = await Promise.all(PAMPHLET.map(s => tr(env, s, 'en', lang)))
  return json({ facts, language, rtl: lang === 'yi', summary, pamphlet })
}

// POST /api/translate: translate short texts.
async function translateRoute(request, env) {
  const { texts, language } = await request.json().catch(() => ({}))
  const lang = LANGS[language]
  if (!lang || !Array.isArray(texts) || texts.length > 25) return json({ error: 'Bad request' }, 400)
  return json({ texts: await Promise.all(texts.map(t => tr(env, String(t).slice(0, 400), 'en', lang))), rtl: lang === 'yi' })
}

// POST /api/submissions: save a suggestion as "pending" in D1 (if the database is set up).
async function submissions(request, env) {
  const b = await request.json().catch(() => null)
  if (!b || !b.name || typeof b.name !== 'string') return json({ error: 'A name is required.' }, 400)
  if (b.website) return json({ ok: true })   // honeypot: bots fill this in
  if (!env.DB) return json({ ok: true, stored: false })
  const c = (v, n) => String(v || '').slice(0, n)
  await env.DB.prepare('INSERT INTO submissions (kind, name, address, details) VALUES (?, ?, ?, ?)')
    .bind(c(b.kind, 60), c(b.name, 120), c(b.address, 200), c(b.details, 800)).run()
  return json({ ok: true, stored: true })
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url), post = request.method === 'POST'
    if (pathname === '/api/health') return json({ ok: true })
    if (pathname === '/api/ask' && post) return ask(request, env)
    if (pathname === '/api/chat' && post) return chat(request, env)
    if (pathname === '/api/brief' && post) return brief(request, env)
    if (pathname === '/api/translate' && post) return translateRoute(request, env)
    if (pathname === '/api/submissions' && post) return submissions(request, env)
    return json({ error: 'Not found' }, 404)
  },
}