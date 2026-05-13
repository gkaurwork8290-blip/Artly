import type { VercelRequest, VercelResponse } from '@vercel/node'

function buildSearchQuery(ideaTitle: string, materials: string[]): string {
  const materialKeywords: Record<string, string> = {
    'air dry clay': 'clay handmade craft',
    'clay': 'clay pottery handmade',
    'acrylic paint': 'acrylic painting art',
    'acrylic': 'acrylic painting canvas',
    'watercolour': 'watercolour painting art',
    'watercolor': 'watercolor painting art',
    'oil paint': 'oil painting canvas art',
    'canvas': 'painting canvas art',
    'pencil': 'pencil sketch drawing',
    'charcoal': 'charcoal sketch art',
    'ink': 'ink drawing art',
    'pastel': 'pastel art drawing',
    'marker': 'marker illustration art',
    'collage': 'collage mixed media art',
    'paper': 'paper craft handmade',
    'fabric': 'fabric textile craft',
    'wood': 'wood craft handmade',
    'leaves': 'botanical leaves nature craft',
    'flowers': 'botanical flowers nature craft',
    'pressed flowers': 'pressed flowers botanical craft',
    'pressed leaves': 'pressed leaves botanical craft',
    'resin': 'resin art handmade',
  }

  // Find best material match
  let materialTerm = 'handmade art craft DIY'
  for (const mat of materials) {
    const lower = mat.toLowerCase()
    for (const [key, val] of Object.entries(materialKeywords)) {
      if (lower.includes(key) || key.includes(lower)) {
        materialTerm = val
        break
      }
    }
  }

  // Extract meaningful words from title
  const titleWords = ideaTitle
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3 && !['with', 'from', 'into', 'your', 'this', 'that', 'using', 'make', 'create'].includes(w))
    .slice(0, 2)
    .join(' ')

  return `${materialTerm} ${titleWords}`.trim()
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
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&category=backgrounds,fashion,nature,science,education,arts&orientation=horizontal&min_width=600&per_page=10&safesearch=true`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Pixabay API failed')

    const data = await response.json()

    if (!data.hits || data.hits.length === 0) {
      // Fallback query if no results
      const fallbackUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent('handmade art craft DIY')}&image_type=photo&orientation=horizontal&min_width=600&per_page=10&safesearch=true`
      const fallbackRes = await fetch(fallbackUrl)
      const fallbackData = await fallbackRes.json()
      if (!fallbackData.hits?.length) {
        return res.status(200).json({ imageUrl: null })
      }
      const fallbackPick = fallbackData.hits[Math.floor(Math.random() * Math.min(5, fallbackData.hits.length))]
      return res.status(200).json({ imageUrl: fallbackPick.webformatURL })
    }

    // Pick randomly from top 5 results for variety
    const pick = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))]
    return res.status(200).json({ imageUrl: pick.webformatURL })

  } catch (error) {
    console.error('Pixabay error:', error)
    return res.status(500).json({ error: 'Image fetch failed' })
  }
}
