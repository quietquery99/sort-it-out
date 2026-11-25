import { readFile, writeFile } from 'node:fs/promises'
import { fetchDataset } from './datasets.mjs'

// Borough digit used in NYC codes: 1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens, 5=Staten Island
const BORO_CODE = { 1: 'Manhattan', 2: 'Bronx', 3: 'Brooklyn', 4: 'Queens', 5: 'Staten Island' }
const KEEP = new Set(['Brooklyn', 'Bronx', 'Queens'])   // pilot + equity comparison boroughs

const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim()
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null }
const inNYC = (lat, lng) => lat > 40.4 && lat < 41.0 && lng > -74.3 && lng < -73.6
const boroFromCode = code => BORO_CODE[String(code).charAt(0)] || ''
// "310" -> "CD 10" (first digit is the borough, the rest is the district number)
const cdLabel = code => { const n = parseInt(String(code).slice(1), 10); return n ? `CD ${n}` : '' }

// "10:00 AM" -> "10am", "07:30 PM" -> "7:30pm"
const tidyTime = t => clean(t)
  .replace(/(\d{1,2}):(\d\d)\s*(AM|PM)/gi, (_, h, m, ap) => `${+h}${m === '00' ? '' : ':' + m}${ap.toLowerCase()}`)
  .replace(/\s*-\s*/g, '–')

// "Monday 10:00 AM-07:00 PM, Tuesday ..." -> "Mon–Sat 10am–7pm; Sun 10am–6pm"
function shortHours(s) {
  const raw = clean(s)
  if (!raw) return 'Check before you go'
  const parts = raw.split(/,\s*(?=(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b)/)
  const entries = parts.map(p => p.match(/^(\w+)day\s+(.*)$/)).filter(Boolean).map(m => [m[1].slice(0, 3), tidyTime(m[2])])
  if (!entries.length) return raw.length > 90 ? raw.slice(0, 87) + '…' : raw
  const runs = []   // group neighbouring days that share the same hours
  for (const [d, t] of entries) {
    const last = runs[runs.length - 1]
    if (last && last.t === t) last.end = d; else runs.push({ start: d, end: d, t })
  }
  const text = runs.map(r => `${r.start === r.end ? r.start : r.start + '–' + r.end} ${r.t}`).join('; ')
  return entries.length === 7 && runs.length === 1 ? `Daily ${runs[0].t}` : text
}

/* ---- one small converter per dataset, written for its real columns ---- */
function safe(row, i) {
  const [lng, lat] = row.point?.coordinates || []
  if (!inNYC(lat, lng)) return null
  return {
    id: `safe-${i}`, layer: 'safe',
    name: `DSNY special waste drop-off, ${clean(row.address)}`,
    borough: BORO_CODE[row.boro] || clean(row.city), cd: cdLabel(row.borocd),
    nta: clean(row.ntaname),   // neighborhood data 
    address: `${clean(row.address)}, ${clean(row.city)} ${clean(row.zip)}`,
    hours: 'Check DSNY for days and hours',
    accepts: 'Household special waste (check DSNY for the accepted list)',
    lat, lng, source: 'NYC Open Data',
  }
}

function compost(row, i) {
  const lat = num(row.latitude), lng = num(row.longitude)
  if (lat == null || lng == null || !inNYC(lat, lng)) return null
  const hours = [row.operation_day_hours, row.open_months].map(clean).filter(Boolean).join(' · ')
    .replace(/\(Start Time:\s*(.*?)\s*-\s*End Time:\s*(.*?)\)/i, '($1 to $2)')
  return {
    id: `compost-${i}`, layer: 'compost',
    name: clean(row.food_scrap_drop_off_site) || clean(row.hosted_by) || 'Food scrap drop-off',
    borough: clean(row.borough), cd: cdLabel(row.borocd),
    nta: clean(row.ntaname),   // neighborhood data 
    address: clean(row.location), hours: hours || 'Check before you go',
    accepts: ['Food scraps', clean(row.notes)].filter(Boolean).join('. '),
    lat, lng, source: 'NYC Open Data',
  }
}

function donate(row, i) {
  const lat = num(row.latitude), lng = num(row.longitude)
  if (lat == null || lng == null || !inNYC(lat, lng)) return null
  const address = clean(row.address).replace(/,?\s*USA$/i, '')
  const borough = boroFromCode(row.community_district) || (address.match(/Brooklyn|Bronx|Queens|Manhattan|Staten Island/) || [''])[0]
  return {
    id: `donate-${i}`, layer: 'textile',
    name: clean(row.site) || 'Donation site',
    borough, cd: cdLabel(row.community_district),
    nta: clean(row.ntaname),   // neighborhood (2020 NTA name); empty for some rows
    address, hours: shortHours(row.hours),
    accepts: clean(row.categoriesaccepted) || 'Check what they accept',
    phone: clean(row.phone), website: clean(row.website),
    lat, lng, source: 'NYC Open Data (DonateNYC)',
  }
}

const JOBS = [
  { id: '242c-ru4i', label: 'DSNY special waste drop-off sites', convert: safe, onlyPilot: false },
  { id: 'if26-z6xq', label: 'Food scrap drop-off locations',     convert: compost, onlyPilot: true },
  { id: 'gkgs-za6m', label: 'DSNY DonateNYC directory',          convert: donate, onlyPilot: true },
]

const all = []
for (const job of JOBS) {
  try {
    const rows = await fetchDataset(job.id)
    let sites = rows.map(job.convert).filter(Boolean)
    if (job.onlyPilot) sites = sites.filter(s => KEEP.has(s.borough))
    console.log(`${job.label}: kept ${sites.length} of ${rows.length}`)
    all.push(...sites)
  } catch (e) { console.warn(`Skipped ${job.label}: ${e.message}`) }
}

// Remove duplicates (same name in the same spot).
const seen = new Set()
const sites = all.filter(s => { const k = `${s.name.toLowerCase()}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`; return seen.has(k) ? false : seen.add(k) })

// Apply hand corrections from src/data/site-fixes.json, so they survive every rebuild.
// Each fix: { "match": text in the site's name or address, "set": { field: new value, ... } }
const fixes = JSON.parse(await readFile('src/data/site-fixes.json', 'utf8'))
for (const fix of fixes) {
  const hits = sites.filter(s => `${s.name} ${s.address}`.toLowerCase().includes(fix.match.toLowerCase()))
  if (!hits.length) console.warn(`⚠ Fix "${fix.match}" matched no site. Check src/data/site-fixes.json`)
  else console.log(`Fix "${fix.match}": updated ${hits.length} site${hits.length === 1 ? '' : 's'}`)
  hits.forEach(s => Object.assign(s, fix.set))
}

await writeFile('src/data/sites.generated.json', JSON.stringify(sites, null, 2))
console.log(`\nWrote ${sites.length} sites to src/data/sites.generated.json`)