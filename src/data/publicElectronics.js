import { ITEMS } from './items'

const dsny = 'https://www.nyc.gov/site/dsny/collection/get-rid-of/electronics.page'
const nyc311 = 'https://portal.311.nyc.gov/article/?kanumber=KA-02385'
const dropOff = 'https://www.nyc.gov/site/dsny/what-we-do/programs/special-waste-drop-off.page'

// Public electronics guidance checked against DSNY and NYC311 on 2026-11-26.
const recyclingId = 'public-electronics-recycling'
const rules = [
  { id: recyclingId, method: 'Electronics Recycling', status: 'required', details: { Conditions: 'Household e-waste for disposal', Restrictions: 'Keep out of trash and curbside recycling' }, sources: [[dsny], [nyc311]] },
  { id: 'public-electronics-donate', method: 'Donate', status: 'conditional', details: { Conditions: 'Working equipment', Restrictions: 'Confirm acceptance with the recipient' }, sources: [[nyc311]] },
  { id: 'public-electronics-takeback', method: 'Manufacturer Take-Back', status: 'permitted', details: { Conditions: 'Check the manufacturer’s recycling program' }, sources: [[dsny]] },
  { id: 'public-electronics-safe', method: 'SAFE Disposal Event', status: 'permitted', details: { Conditions: 'NYC residents with household electronics', Restrictions: 'Check the event date and location' }, sources: [[dsny]] },
]

const cupItems = [
  { id: 'paper-cup', name: 'Paper cup', stream: 'pap', steps: ['Empty and dry the cup, then recycle it with mixed paper and cardboard.'], source: 'https://www.nyc.gov/site/dsny/collection/get-rid-of/mixed-paper-cardboard.page' },
  { id: 'plastic-cup', name: 'Rigid plastic cup', stream: 'mgp', steps: ['Empty and rinse the cup, then recycle it with metal, glass and rigid plastic.'], source: 'https://www.nyc.gov/site/dsny/collection/get-rid-of/metal-glass-plastic-cartons.page' },
  { id: 'foam-cup', name: 'Foam cup', stream: 'trash', steps: ['Place the foam cup in household trash.'], source: 'https://www.nyc.gov/site/dsny/collection/get-rid-of/mixed-paper-cardboard.page' },
].map(item => ({ ...item, cat: 'Cups', aliases: ['cup', 'coffee cup', 'disposable cup'] }))

export const publicSearchItems = ITEMS.map(item => {
  const entry = { ...item, aliases: item.keywords.replace('laptop battery', '').trim().split(' ').concat(item.id === 'liion' ? ['laptop battery'] : []) }
  if (!['laptop', 'tv'].includes(item.id)) return entry
  return { ...entry, category: item.cat, subcategory: 'Computers and electronics', rules }
}).concat(cupItems)

const entrances = {
  FAC_b966d78c7b0363f3: '74 Pike Slip, under the Manhattan Bridge',
  FAC_0a7774f820676e1a: '30th Avenue between 120th and 122nd Streets',
  FAC_53f85b929ae5b85c: 'Muldoon Avenue exit, past the DSNY security booth',
  FAC_5bed278de29f9415: 'Kingsland Avenue entrance near 530 Kingsland Avenue',
  FAC_48ee6b4937d39348: 'Farragut Street off Food Center Drive, by the Fulton Fish Market',
}

export function publicElectronicsSites(ruleId, facilities) {
  if (ruleId !== recyclingId) return []
  return Object.entries(entrances).filter(([id]) => facilities[id]).map(([id, address]) => ({
    ...facilities[id], address, sources: [dropOff],
    notes: ['Residents only. Bring proof of NYC residency. Commercial vehicles are excluded.'],
    serviceHours: ['Tuesday–Saturday, 9 am–3 pm. Closed on legal holidays and during severe weather.'],
  }))
}
