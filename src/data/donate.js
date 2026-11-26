// Search terms for item groups in the donation directory.
const rows = [
  ['Clothing & coats', 'clothes clothing coat jacket shirt pants sweater dress'],
  ['Shoes & sneakers', 'shoes sneakers boots sandals'],
  ['Books', 'books novels textbooks magazines records'],
  ['Dishes, pots & kitchenware', 'dishes plates pots pans cups glasses utensils kitchenware'],
  ['Furniture (clean and sturdy)', 'furniture couch sofa chair table desk dresser bookshelf'],
  ['Toys & games', 'toys games puzzles lego'],
  ['Art & craft supplies', 'art craft supplies paint brushes yarn fabric'],
  ['Working small appliances', 'toaster blender lamp kettle fan vacuum appliance'],
  ['Working electronics', 'laptop phone tablet camera electronics console'],
  ['Large appliances', 'fridge refrigerator washer dryer stove dishwasher'],
  ['Unopened shelf-stable food', 'food canned cans pantry packaged pasta rice nonperishable unopened'],
  ['Old TVs & monitors', 'tv television monitor crt'],
]

export const DONATE = rows.map(([name, keywords]) => ({ id: name, name, keywords }))
