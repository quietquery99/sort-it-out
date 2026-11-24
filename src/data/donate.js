// Donation rules of thumb. Policies vary by organization, so the app always says "ask first" for the gray areas.
// verdict: 'yes' | 'maybe' | 'no'
export const VERDICTS = {
  yes:   { label: 'Usually accepted',     color: '#23904F' },
  maybe: { label: 'Ask first',            color: '#B26A00' },
  no:    { label: 'Usually not accepted', color: '#C2410C' },
}

// [name, search keywords, verdict, note]
const rows = [
  ['Clothing & coats', 'clothes clothing coat jacket shirt pants sweater dress', 'yes', 'Clean and dry. Even worn-out clothing can go in a textile bin for recycling.'],
  ['Shoes & sneakers', 'shoes sneakers boots sandals', 'yes', 'Tie the pairs together so they stay matched.'],
  ['Books', 'books novels textbooks magazines records', 'yes', 'Most thrift stores take them. Old textbooks and encyclopedias are sometimes refused.'],
  ['Dishes, pots & kitchenware', 'dishes plates pots pans cups glasses utensils kitchenware', 'yes', 'Clean, complete, and not chipped.'],
  ['Furniture (clean and sturdy)', 'furniture couch sofa chair table desk dresser bookshelf', 'yes', 'Reuse hubs like Big Reuse take solid pieces. Call or check online first for large items.'],
  ['Toys & games', 'toys games puzzles lego', 'yes', 'Clean and complete, with all the pieces.'],
  ['Art & craft supplies', 'art craft supplies paint brushes yarn fabric', 'yes', 'Reuse centers often welcome them.'],
  ['Usable paint & building materials', 'paint building materials lumber tiles hardware tools', 'yes', 'Big Reuse takes usable paint and building materials; most thrift stores do not.'],
  ['Bedding, towels & linens', 'bedding sheets towels blankets linens curtains', 'maybe', 'Textile bins often accept them. Many thrift stores prefer like-new. Ask first.'],
  ['Pillows & stuffed animals', 'pillows stuffed animals plush cushions', 'maybe', 'Many places refuse them for hygiene reasons. Ask first.'],
  ['Working small appliances', 'toaster blender lamp kettle fan vacuum appliance', 'maybe', 'Some shops test and accept them. A repair café may fix them. Ask first.'],
  ['Working electronics', 'laptop phone tablet camera electronics console', 'maybe', 'Donate to a program that wipes devices, or recycle through ecycleNYC.'],
  ['Large appliances', 'fridge refrigerator washer dryer stove dishwasher', 'maybe', 'Some places take working ones. A discarded fridge needs refrigerant removal; see the Disposal tab.'],
  ['Mattresses & box springs', 'mattress box spring bed', 'no', 'Most donation centers cannot take them. Seal in a mattress bag for bulk collection.'],
  ['Cribs & car seats', 'crib car seat stroller baby', 'no', 'Safety rules and expiry dates mean most places cannot take them. Check recalls and expiry first.'],
  ['Broken or stained items', 'broken stained torn damaged ripped', 'no', 'Clothing can still go in a textile bin. Other broken items belong in trash or bulk collection.'],
  ['Open food & used cosmetics', 'food cosmetics makeup perfume lotion', 'no', 'Not accepted. Unopened non-perishable food can go to a food pantry.'],
  ['Hazardous items', 'chemicals batteries open paint solvent propane', 'no', 'Take these to a SAFE event, not a donation center.'],
  ['Old TVs & monitors', 'tv television monitor crt', 'no', 'Most places cannot reuse them. Recycle through ecycleNYC.'],
]

export const DONATE = rows.map(([name, keywords, verdict, note], i) => ({ id: i, name, keywords, verdict, note }))