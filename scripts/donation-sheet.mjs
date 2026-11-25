// Donation sites come from a Google Sheet that anyone can edit without code.
// `npm run data` reads it (along with the DSNY Open Data sets) and puts the sites on the map.
//
// THE SHEET
//   Columns (row 1): Donation Site | Description | What do they collect? | Waste Type | DIY? |
//                    Address | NTA | Hours | Website Link
//   - Only "Donation Site" and "Address" are required. A site without an address can't go on the
//     map, so it's skipped (the build prints a warning naming it).
//   - The sheet must be shared as "Anyone with the link can view".
//   - Map category comes from "Waste Type" (and "What do they collect?"): sites that take food
//     (Organics / Food/Beverage) go under "Food donation"; sites that take anything else go under
//     "Textiles & reuse". A site that takes both shows up under both.
//
// LOCATIONS
//   The map needs coordinates, so each address is looked up with NYC's address search
//   (geosearch.planninglabs.nyc). Results are saved in scripts/geocode-cache.json, so only new or
//   changed addresses are looked up next time. If a pin lands in the wrong place, fix the address
//   in the sheet, or add a correction in src/data/site-fixes.json.
import { readFile, writeFile } from 'node:fs/promises'

// The sheet, and which tab. To change it: open the sheet, copy the id from its address
// (docs.google.com/spreadsheets/d/<ID>/edit) and the tab's number (#gid=<TAB>), and paste them here.
const SHEET_ID = '1aYAZ4aoioaOyQ9RGHfQc_KEMndDbQjjIG-cmyv2PRsA'
const TAB_GID = '187832181'
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TAB_GID}`

const CACHE = 'scripts/geocode-cache.json'
const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim()
const url = v => !v ? '' : /^https?:\/\//i.test(v) ? v : `https://${v}`
const inNYC = (lat, lng) => lat > 40.4 && lat < 41.0 && lng > -74.3 && lng < -73.6

// Reads CSV text into rows of cells. Handles quoted cells that contain commas, quotes or line breaks.
function parseCSV(text) {
  text = text.replace(/^﻿/, '')
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(v => v.trim()))
}

// Address -> { lat, lng, borough, nta } using NYC's free address search, plus the city's
// neighborhood (NTA) boundaries for the neighborhood name.
async function lookup(address) {
  const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`)
  const f = (await res.json()).features?.[0]
  if (!f) return null
  const [lng, lat] = f.geometry.coordinates
  if (!inNYC(lat, lng)) return null
  const q = `$select=ntaname&$where=${encodeURIComponent(`intersects(the_geom,'POINT(${lng} ${lat})')`)}`
  const nta = await fetch(`https://data.cityofnewyork.us/resource/9nt8-h7nd.json?${q}`).then(r => r.json()).then(d => d[0]?.ntaname || '').catch(() => '')
  return { lat, lng, borough: f.properties.borough || '', nta, matched: f.properties.label }
}

export async function loadDonationSheet() {
  const res = await fetch(SHEET_CSV)
  const text = await res.text()
  if (!res.ok || /<html/i.test(text.slice(0, 300))) throw new Error('Check the sheet is shared as "Anyone with the link can view".')

  const [header, ...rows] = parseCSV(text)
  const col = name => header.findIndex(h => clean(h).toLowerCase() === name)
  const C = {
    site: col('donation site'), description: col('description'), collects: col('what do they collect?'),
    wasteType: col('waste type'), diy: col('diy?'), address: col('address'), nta: col('nta'),
    hours: col('hours'), website: col('website link'),
  }
  if (C.site < 0 || C.address < 0) throw new Error('The sheet needs "Donation Site" and "Address" columns.')
  const get = (r, k) => C[k] < 0 ? '' : clean(r[C[k]])

  let cache = {}
  try { cache = JSON.parse(await readFile(CACHE, 'utf8')) } catch {}

  const sites = [], skipped = []
  let looked = 0
  for (const [i, r] of rows.entries()) {
    const name = get(r, 'site'), address = get(r, 'address')
    if (!name) continue
    if (!address) { skipped.push(`${name} (no address)`); continue }
    // Text like "Various branches" or "Online" isn't a place. Real addresses have a street number,
    // or name an intersection ("Douglass Street & Bond Street").
    if (!/\d/.test(address) && !/ & | and /i.test(address)) { skipped.push(`${name} (not a street address: "${address}")`); continue }
    if (!(address in cache)) { cache[address] = await lookup(address).catch(() => null); looked++ }
    const loc = cache[address]
    if (!loc) { skipped.push(`${name} (address not found: "${address}")`); continue }
    // Map categories from the sheet: food donations get "Food donation"; anything else they take
    // (clothes, books, household items...) gets "Textiles & reuse". A site can be in both.
    const types = get(r, 'wasteType').split(',').map(t => clean(t).toLowerCase()).filter(Boolean)
    const food = types.includes('organics') || /food\/beverage/i.test(get(r, 'collects'))
    const other = !types.length || types.some(t => t !== 'organics')
    const layers = [...(other ? ['textile'] : []), ...(food ? ['food'] : [])]
    sites.push({
      id: `donate-${i}`, layer: layers[0], layers,
      name, description: get(r, 'description'),
      borough: loc.borough, cd: '', nta: get(r, 'nta') || loc.nta,
      address, hours: get(r, 'hours') || 'Check before you go',
      accepts: get(r, 'collects') || get(r, 'wasteType') || 'Check what they accept',
      wasteType: get(r, 'wasteType'), diy: /^y/i.test(get(r, 'diy')),
      website: url(get(r, 'website')),
      lat: loc.lat, lng: loc.lng, source: 'Donation sites sheet',
    })
  }

  await writeFile(CACHE, JSON.stringify(cache, null, 2) + '\n')
  if (looked) console.log(`Looked up ${looked} new address${looked === 1 ? '' : 'es'}`)
  for (const s of skipped) console.warn(`⚠ Not on the map: ${s}`)
  return sites
}
