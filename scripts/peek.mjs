import { DATASETS, fetchDataset } from './datasets.mjs'

for (const d of DATASETS) {
  try {
    const rows = await fetchDataset(d.id)
    console.log(`\n=== ${d.label} (${d.id}): ${rows.length} rows ===`)
    console.log('Fields:', Object.keys(rows[0] || {}).join(', '))
    console.log('Sample:', JSON.stringify(rows[0], null, 2))
  } catch (e) {
    console.log(`\n=== ${d.label}: FAILED ===\n${e.message}`)
  }
}