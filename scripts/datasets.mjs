// NYC Open Data datasets cited in the midterm report.
export const DATASETS = [
  { id: '242c-ru4i', layer: 'safe',    label: 'DSNY special waste drop-off sites' },
  { id: 'if26-z6xq', layer: 'compost', label: 'Food scrap drop-off locations' },
  { id: 'gkgs-za6m', layer: 'textile', label: 'DSNY DonateNYC directory' },
]

export async function fetchDataset(id) {
  const headers = process.env.SOCRATA_APP_TOKEN ? { 'X-App-Token': process.env.SOCRATA_APP_TOKEN } : {}
  const res = await fetch(`https://data.cityofnewyork.us/resource/${id}.json?$limit=5000`, { headers })
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`)
  return res.json()
}