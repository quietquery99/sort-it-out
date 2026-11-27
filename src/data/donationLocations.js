import { SITES } from './sites'
import { donationByName } from './donate'

// The seed lists broad materials per category. Use the directory's more
// specific tags for each item before presenting a location as a contact lead.
const tagGroups = [
  ['Clothing/Personal Accessories', 'clothing shirts jeans coat backpack handbag baby-clothing'],
  ['Footwear', 'shoes'],
  ['Textile', 'linens towels curtains bedding'],
  ['Household Furniture', 'household-goods chair table desk bookshelf dresser lamp'],
  ['Kitchen Items', 'dishes cookware'],
  ['Appliances', 'small-appliance microwave'],
  ['Books/Media', 'books textbooks dvds vinyl-records'],
  ['Arts/Crafts', 'art-supplies'],
  ['Office Supplies', 'unused-notebooks office-supplies'],
  ['Electronics', 'laptop desktop-computer computer-monitor keyboard mouse printer scanner television tablet e-reader video-game-console smartphone'],
  ['Toys/Games', 'toys board-games puzzles stuffed-animal'],
  ['Baby Care', 'stroller'],
  ['Sports Equipment', 'bicycle basketball tennis-racket'],
  ['Musical Instruments', 'guitar keyboard-instrument'],
  ['Camping/Outdoor Equipment', 'camping-tent'],
  ['Tools/Equipment', 'hand-tools'],
  ['Lawn/Garden Supplies', 'garden-tools'],
  ['Building Products', 'usable-hardware reusable-lumber'],
  ['Storage Containers', 'storage-bins'],
  ['Food/Beverage', 'shelf-stable-food fresh-food'],
  ['Personal Care/Hygiene', 'unopened-toiletries'],
  ['Pet Care/Food', 'pet-food'],
  ['Cleaning Products', 'cleaning-products'],
  ['HealthCare', 'wheelchair crutches'],
]
const tags = new Map(tagGroups.flatMap(([tag, slugs]) => slugs.split(' ').map(slug => [slug, tag])))

export function donationLocations(name) {
  const tag = tags.get(donationByName.get(name)?.slug)
  if (!tag) return []
  return SITES.filter(site => site.source === 'Donation sites sheet' &&
    site.accepts.split(',').some(value => value.trim() === tag))
}
