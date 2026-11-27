import seed from './donation.seed.json'

export const donationCategories = seed.site_categories.map(category => category.name)
export const DONATE = seed.items
export const donationByName = new Map(DONATE.map(item => [item.name, item]))
export const donationSources = seed.source_links

const synonyms = {
  'household-goods': 'sofa couch furniture',
  'shelf-stable-food': 'canned food nonperishable pantry',
  coat: 'jacket outerwear', shirts: 'shirt clothing', shoes: 'sneakers boots footwear',
  television: 'tv', smartphone: 'phone cellphone', 'small-appliance': 'toaster blender',
}

export function matchesDonation(item, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const text = [item.name, item.site_category, synonyms[item.slug]].join(' ').toLowerCase()
  return terms.every(term => text.includes(term))
}
