import { readFile, writeFile } from 'node:fs/promises'
import { fetchDataset } from './datasets.mjs'
import { loadDonationSheet } from './donation-sheet.mjs'

// Borough digit used in NYC codes: 1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens, 5=Staten Island
const BORO_CODE = { 1: 'Manhattan', 2: 'Bronx', 3: 'Brooklyn', 4: 'Queens', 5: 'Staten Island' }
const KEEP = new Set(['Brooklyn', 'Bronx', 'Queens'])   // pilot + equity comparison boroughs

const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim()
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null }
const inNYC = (lat, lng) => lat > 40.4 && lat < 41.0 && lng > -74.3 && lng < -73.6
// "310" -> "CD 10" (first digit is the borough, the rest is the district number)
const cdLabel = code => { const n = parseInt(String(code).slice(1), 10); return n ? `CD ${n}` : '' }

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

const JOBS = [
  { id: '242c-ru4i', label: 'DSNY special waste drop-off sites', convert: safe, onlyPilot: false },
  { id: 'if26-z6xq', label: 'Food scrap drop-off locations',     convert: compost, onlyPilot: true },
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

// Donation sites come from the Google Sheet (see donation-sheet.mjs). If the sheet can't be read,
// stop without saving, so the map keeps its current donation sites instead of losing them.
try {
  const donations = await loadDonationSheet()
  console.log(`Donation sites (Google Sheet): kept ${donations.length}`)
  all.push(...donations)
} catch (e) {
  console.error(`\nStopped: couldn't read the donation sites sheet. ${e.message}\nNothing was changed.`)
  process.exit(1)
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