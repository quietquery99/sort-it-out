import { publicSearchItems, publicElectronicsSites } from './publicElectronics'
import published from './disposal.published.json'

const preview = import.meta.env?.MODE === 'guide-preview'
const previewFiles = import.meta.glob('./disposal.preview.json', { eager: true, import: 'default' })
export const catalog = (preview && previewFiles['./disposal.preview.json']) || published
export const guidePreview = preview && catalog !== published
export const itemsById = new Map((catalog.items.length ? catalog.items : publicSearchItems.filter(item => item.rules)).map(item => [item.id, item]))
export const officialGuide = 'https://www.nyc.gov/site/dsny/collection/get-rid-of.page'

const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim()
export function searchItems(items, query) {
  const terms = normalize(query).split(' ').filter(Boolean)
  return items.filter(item => {
    const text = normalize([item.name, ...item.aliases, item.category, item.subcategory].join(' '))
    return terms.every(term => text.includes(term))
  })
}

export function groupItems(items) {
  const categories = new Map()
  for (const item of items) {
    if (!categories.has(item.category)) categories.set(item.category, new Map())
    const subcategories = categories.get(item.category)
    if (!subcategories.has(item.subcategory)) subcategories.set(item.subcategory, [])
    subcategories.get(item.subcategory).push(item)
  }
  return categories
}

// Match item names inside questions. Keep broad terms (such as "cup") ambiguous.
export function journeyMatches(query, items = catalog.items) {
  const words = value => normalize(value).split(' ').map(word => word === 'batteries' ? 'battery' : word)
  const phrase = words(query).join(' ').trim()
  if (phrase.length < 2) return { options: [] }
  const exact = items.filter(item => [item.name, ...item.aliases].some(name => words(name).join(' ') === phrase))
  if (exact.length === 1) return { item: exact[0], options: exact }
  const contained = items.filter(item => [item.name, ...item.aliases].some(name =>
    name && (' ' + phrase + ' ').includes(' ' + words(name).join(' ') + ' ')))
  if (contained.length) return { item: contained.length === 1 ? contained[0] : null, options: contained }
  const ignored = new Set('a an my the old it of in to after how where should i dispose can be been after finishing directly throw thrown bin trash this do with what donated repaired recycled or and disposable'.split(' '))
  const terms = words(query).filter(term => term.length > 1 && !ignored.has(term))
  // Container material, battery chemistry and computer type change the guidance.
  const generic = ['cup', 'battery', 'computer'].find(term => terms.includes(term))
  const candidates = generic ? [generic] : terms
  if (!candidates.length) return { options: [] }
  const options = items.filter(item => {
    const text = words([item.name, ...item.aliases].join(' ')).join(' ')
    return candidates.every(term => text.includes(term))
  })
  return { item: options.length === 1 ? options[0] : null, options }
}

export function matchingFacilities(itemId, ruleId) {
  const item = itemsById.get(itemId)
  const rule = item?.rules.find(option => option.id === ruleId)
  if (!rule || rule.status === 'prohibited') return []
  if (!catalog.items.length) return publicElectronicsSites(ruleId, catalog.facilities)
  const sites = new Map()
  for (const [id, notes, source, hours] of catalog.matches[ruleId] || []) {
    if (!sites.has(id)) sites.set(id, { ...catalog.facilities[id], notes: [], sources: [], serviceHours: [] })
    const site = sites.get(id)
    if (hours && !site.serviceHours.includes(hours)) site.serviceHours.push(hours)
    site.notes = [...new Set([...site.notes, ...notes])]
    if (source && !site.sources.includes(source)) site.sources.push(source)
  }
  return [...sites.values()]
}
