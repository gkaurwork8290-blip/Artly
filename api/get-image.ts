import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageKeywords } = req.body
  const apiKey = process.env.PIXABAY_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Pixabay API key not configured' })
  if (!imageKeywords) return res.status(400).json({ error: 'imageKeywords required' })

  // imageKeywords is already a comma-separated string from Claude
  // e.g. "watercolour, landscape, painting, art"
  // Pixabay accepts comma-separated keywords in q parameter
  const query = encodeURIComponent(imageKeywords)

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=horizontal&min_width=600&per_page=10&safesearch=true&order=popular`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Pixabay API error: ${response.status}`)
    const data = await response.json()

    if (!data.hits || data.hits.length === 0) {
      return res.status(200).json({ imageUrl: null })
    }

    const pick = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))]
    return res.status(200).json({ imageUrl: pick.webformatURL })

  } catch (error) {
    console.error('Pixabay error:', error)
    return res.status(500).json({ error: 'Image fetch failed' })
  }
}
