import type { VercelRequest, VercelResponse } from '@vercel/node'

function buildSearchQuery(ideaTitle: string, materials: string[]): string {
  // Material → art category mapping
  const materialKeywords: Record<string, string> = {
    'air dry clay': 'clay handmade sculpture DIY craft',
    'clay': 'clay pottery handmade craft',
    'acrylic paint': 'acrylic painting canvas art',
    'acrylic': 'acrylic painting art',
    'watercolour': 'watercolour painting art',
    'watercolor': 'watercolor painting art',
    'oil paint': 'oil painting canvas art',
    'canvas': 'painting canvas art',
    'pencil': 'pencil sketch drawing art',
    'pencils': 'pencil sketch drawing art',
    'charcoal': 'charcoal sketch drawing art',
    'ink': 'ink drawing illustration art',
    'pastel': 'pastel drawing art',
    'marker': 'marker illustration drawing art',
    'markers': 'marker illustration drawing art',
    'sketchbook': 'sketch drawing art illustration',
    'collage': 'collage mixed media art',
    'paper': 'paper craft handmade art',
    'fabric': 'fabric textile craft handmade',
    'wood': 'wood craft carving handmade',
    'leaves': 'botanical leaves nature art',
    'flowers': 'botanical flowers nature art',
    'pressed flowers': 'pressed flowers botanical craft',
    'pressed leaves': 'pressed leaves botanical art',
    'resin': 'resin art handmade craft',
  }

  // Find best material match
  let materialTerm = 'handmade art DIY craft'
  for (const mat of materials) {
    const lower = mat.toLowerCase()
    for (const [key, val] of Object.entries(materialKeywords)) {
      if (lower.includes(key) || key.includes(lower)) {
        materialTerm = val
        break
      }
    }
    if (materialTerm !== 'handmade art DIY craft') break
  }

  // Extract 2-3 meaningful words from idea title
  const stopWords = ['with', 'from', 'into', 'your', 'this', 'that', 'using', 'make', 'create', 'and', 'the', 'for', 'study', 'exploration', 'design']
  const titleWords = ideaTitle
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .slice(0, 2)
    .join(' ')

  // Combine material term with title words
  const query = `${materialTerm} ${titleWords}`.trim()
  return query
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ideaTitle, materials = [] } = req.body
  const apiKey = process.env.PIXABAY_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Pixabay API key not configured' })
  if (!ideaTitle) return res.status(400).json({ error: 'ideaTitle required' })

  const query = buildSearchQuery(ideaTitle, materials)

  try {
    // Pixabay API — use + for spaces in query, photo type, horizontal, safe
    const encodedQuery = query.replace(/\s+/g, '+')
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodedQuery}&image_type=photo&orientation=horizontal&min_width=600&per_page=10&safesearch=true&order=popular`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Pixabay API error: ${response.status}`)

    const data = await response.json()

    if (!data.hits || data.hits.length === 0) {
      // Fallback: search just the material term
      const fallbackQuery = 'handmade+art+craft+DIY+painting'
      const fallbackUrl = `https://pixabay.com/api/?key=${apiKey}&q=${fallbackQuery}&image_type=photo&orientation=horizontal&min_width=600&per_page=10&safesearch=true`
      const fallbackRes = await fetch(fallbackUrl)
      const fallbackData = await fallbackRes.json()
      if (!fallbackData.hits?.length) return res.status(200).json({ imageUrl: null })
      const pick = fallbackData.hits[Math.floor(Math.random() * Math.min(5, fallbackData.hits.length))]
      return res.status(200).json({ imageUrl: pick.webformatURL })
    }

    // Pick randomly from top 5 for variety
    const pick = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))]
    return res.status(200).json({ imageUrl: pick.webformatURL })

  } catch (error) {
    console.error('Pixabay error:', error)
    return res.status(500).json({ error: 'Image fetch failed' })
  }
}
