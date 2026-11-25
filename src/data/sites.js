import generated from './sites.generated.json'
import manual from './manual-sites.json'

// Sample pins for layers that have no Open Data source yet (ecycleNYC and repair events).
// Replace these by adding verified entries to manual-sites.json.
// Row format: [name, layer, borough, district, lat, lng, hours, accepts, address]
const rows = [
  ['ecycleNYC building program, Sunset Park', 'ecycle', 'Brooklyn', 'CD 7', 40.6560, -74.0090, 'Building enrollment', 'Laptops, phones, TVs (processed by ERI)', 'Sunset Park'],
  ['Downtown Brooklyn e-waste point', 'ecycle', 'Brooklyn', 'CD 2', 40.6920, -73.9857, 'Mon–Sat 10am–6pm', 'Small electronics, cables', 'Downtown Brooklyn'],
  ['Jamaica e-waste drop-off', 'ecycle', 'Queens', 'CD 12', 40.7000, -73.7970, 'Mon–Fri 9am–5pm', 'Electronics', 'Jamaica'],
  ['Repair Café, Flatbush library', 'repair', 'Brooklyn', 'CD 14', 40.6480, -73.9590, '1st Sat 11am–3pm', 'Small appliances, clothes, bikes', 'Flatbush'],
  ['Bushwick repair & swap', 'repair', 'Brooklyn', 'CD 4', 40.7050, -73.9235, '2nd Sun noon–4pm', 'Clothes swap, repairs', 'Bushwick'],
  ['Downtown swap day', 'repair', 'Brooklyn', 'CD 2', 40.6930, -73.9850, 'Last Sat 10am–2pm', 'Books, clothes, housewares', 'Downtown Brooklyn'],
]

const SAMPLE = rows.map((r, i) => ({
  id: `sample-${i}`, sample: true, name: r[0], layer: r[1], borough: r[2], cd: r[3],
  lat: r[4], lng: r[5], hours: r[6], accepts: r[7], address: r[8],
}))

// Real Open Data + our own verified entries, plus the sample pins for layers with no real data yet.
// Every site gets a `layers` list (a site can be in several map categories, e.g. food AND textiles).
// Sites with just one `layer` get a list of one. `layer` stays as the main one, used for its color.
export const SITES = [
  ...generated,
  ...manual.map((m, i) => ({ id: `manual-${i}`, ...m })),
  ...SAMPLE,
].map(s => ({ ...s, layers: s.layers || [s.layer] }))