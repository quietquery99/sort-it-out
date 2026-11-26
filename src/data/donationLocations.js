import { SITES } from './sites'

// These labels come from the directory's accepted-material field. A category
// match is a contact lead: the organization still decides on the specific item.
const acceptedCategories = {
  'Clothing & coats': ['Clothing/Personal Accessories'],
  'Shoes & sneakers': ['Footwear'],
  Books: ['Books/Media'],
  'Dishes, pots & kitchenware': ['Kitchen Items'],
  'Furniture (clean and sturdy)': ['Household Furniture'],
  'Toys & games': ['Toys/Games'],
  'Art & craft supplies': ['Arts/Crafts'],
  'Working small appliances': ['Appliances'],
  'Large appliances': ['Appliances'],
  'Old TVs & monitors': ['Electronics'],
  'Working electronics': ['Electronics'],
  'Unopened shelf-stable food': ['Food/Beverage'],
}

export function donationLocations(name) {
  const categories = acceptedCategories[name] || []
  return SITES.filter(site => site.source === 'Donation sites sheet' &&
    site.accepts.split(',').some(tag => categories.includes(tag.trim())))
}
