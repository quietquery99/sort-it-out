import { DISTRICTS, COMPLAINT_TYPES } from '../src/data/districts.js'

// Language names shown in the app -> codes the translation model understands
const LANGS = { English: 'en', Spanish: 'es', Chinese: 'zh', Russian: 'ru', Bengali: 'bn', 'Haitian Creole': 'ht', Yiddish: 'yi' }

// The pamphlet in English; we translate it line by line.
const PAMPHLET = [
  'Sort it right',
  'Food scraps and yard waste go in the brown bin.',
  'Batteries never go in the trash or recycling. Take them to a SAFE site.',
  'Look up any item at SortItOut.',
]

const json = (data, status = 200) => Response.json(data, { status })

// Translate one piece of text. If anything fails, fall back to the English original.
async function translate(env, text, lang) {
  if (lang === 'en') return text
  try {
    const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang: 'en', target_lang: lang })
    return r.translated_text || text
  } catch { return text }
}

// POST /api/brief: build facts from our data, let the AI write a short summary, translate everything.
async function brief(request, env) {
  const { districtId, language } = await request.json().catch(() => ({}))
  const d = DISTRICTS.find(x => x.id === districtId)
  const lang = LANGS[language]
  if (!d || !lang) return json({ error: 'Unknown district or language.' }, 400)

  const top = d.complaints.indexOf(Math.max(...d.complaints))
  const facts = {
    name: d.name, diversion: d.diversion, refuse: d.refuse,
    topComplaint: COMPLAINT_TYPES[top], topShare: d.complaints[top],
  }

  // Step 1: the AI only sees these facts, and is told not to invent anything.
  const prompt = `District: ${d.name}
Diversion rate: ${d.diversion}% (citywide potential is 75%)
Refuse per household: ${d.refuse} lbs per week
Largest 311 sanitation complaint: ${facts.topComplaint}, ${facts.topShare}% of complaints`

  let summaryEn
  try {
    const ai = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You write plain-language briefs for NYC Community Boards. Use ONLY the facts the user gives you. Never invent numbers, programs, places or dates. Write exactly 3 short sentences: what the numbers show, the main problem, and one outreach suggestion.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 220,
    })
    summaryEn = ai.response
  } catch {
    return json({ error: 'The AI service is not available right now. Make sure you are logged in to Cloudflare (npx wrangler login) and try again.' }, 502)
  }

  // Step 2: translate (one sentence at a time works best for this model).
  const sentences = summaryEn.split(/(?<=[.!?])\s+/).filter(Boolean)
  const translated = await Promise.all(sentences.map(s => translate(env, s, lang)))
  const pamphlet = await Promise.all(PAMPHLET.map(s => translate(env, s, lang)))

  return json({ facts, language, rtl: lang === 'yi', summary: translated.join(' '), pamphlet })
}

// POST /api/submissions: save a resident suggestion as "pending" in the D1 database.
async function submissions(request, env) {
  const b = await request.json().catch(() => null)
  if (!b || !b.name || typeof b.name !== 'string') return json({ error: 'A name is required.' }, 400)
  if (b.website) return json({ ok: true }) // honeypot filled in = bot, pretend success

  const clip = (v, n) => String(v || '').slice(0, n)
  if (!env.DB) return json({ ok: true, stored: false }) // database not set up yet
  await env.DB.prepare('INSERT INTO submissions (kind, name, address, details) VALUES (?, ?, ?, ?)')
    .bind(clip(b.kind, 60), clip(b.name, 120), clip(b.address, 200), clip(b.details, 800))
    .run()
  return json({ ok: true, stored: true })
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/health') return json({ ok: true, time: new Date().toISOString() })
    if (pathname === '/api/brief' && request.method === 'POST') return brief(request, env)
    if (pathname === '/api/submissions' && request.method === 'POST') return submissions(request, env)
    return json({ error: 'Not found' }, 404)
  },
}