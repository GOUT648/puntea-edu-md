import { audiences, categories, fold } from './taxonomy.mjs'

const day = 86400000
const normalizedWords = value => [...new Set(fold(value).split(/[^a-z0-9]+/).filter(word => word.length >= 3))]

export function rankOpportunities(candidates, preferences, today) {
  const { interests, category, audience, context } = preferences
  const keywords = normalizedWords(interests)
  const contextWords = normalizedWords(context)
  const results = []
  for (const item of candidates) {
    if (item.deadline && item.deadline < today) continue
    if (item.eventDate && item.eventDate < today) continue
    const text = fold(item.searchText)
    const matches = keywords.filter(word => text.includes(word))
    const matchesCategory = Boolean(category && category === item.category)
    const matchesAudience = Boolean(audience && item.audiences.includes(audience))
    const generalAudience = Boolean(audience && item.audiences.includes('toti'))
    const contextMatches = contextWords.filter(word => text.includes(word))
    if (!matches.length && !matchesCategory && !matchesAudience && !contextMatches.length) continue
    const reasons = []
    let score = 0
    if (matches.length) {
      score += Math.round(35 * matches.length / keywords.length)
      reasons.push('Temă · ' + matches.join(', '))
    }
    if (matchesCategory) {
      score += 20
      reasons.push('Categorie · ' + categories[category])
    }
    if (matchesAudience || generalAudience) {
      score += matchesAudience ? 15 : 7
      reasons.push('Public · ' + (matchesAudience ? audiences[audience] : 'deschis tuturor'))
    }
    if (contextMatches.length) {
      score += Math.round(10 * contextMatches.length / contextWords.length)
      reasons.push('Context · ' + contextMatches.join(', '))
    }
    const nextDate = item.deadline || item.eventDate
    const days = nextDate ? (Date.parse(nextDate) - Date.parse(today)) / day : Infinity
    if (days <= 30) {
      score += days <= 7 ? 10 : 7
      reasons.push('Dată apropiată · ' + nextDate)
    } else if (Number.isFinite(days)) score += 3
    if (item.source) {
      score += item.conflict ? 3 : item.deadline || item.eventDate ? 10 : 6
      reasons.push(item.conflict ? 'Termen de clarificat la organizator' : 'Sursă publică disponibilă')
    }
    results.push({ ...item, score, reasons })
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'ro')).slice(0, 8)
}
