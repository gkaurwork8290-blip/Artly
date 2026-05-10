import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { materials, ideaTitle, ideaSteps } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });

  const userPrompt = `You are helping an artist plan their colour palette.

Art project: "${ideaTitle || 'General artwork'}"
${ideaSteps && ideaSteps.length > 0 ? `Project steps: ${ideaSteps.slice(0, 3).join('; ')}` : ''}
Artist's actual materials: ${materials.join(', ')}

Generate a realistic colour palette that:
1. Uses ONLY colours that can actually be mixed or created from the listed materials
2. Reflects the mood and subject of the project title (e.g. "leaf collage" = earthy greens/browns, "ocean painting" = blues/teals)
3. Includes 5-7 colours maximum
4. Provides a single short mixing hint (e.g. "Mix Green + Yellow + Brown for leaf tones")

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "colors": [
    { "name": "string — specific colour name e.g. Olive Green", "hex": "#xxxxxx", "materialSource": "which material this comes from" }
  ],
  "mixHint": "Mix: ColourA + ColourB + ColourC for [effect]"
}

The hex values must visually match the named colour. The mixHint must name 2-3 actual colours from the palette.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: 'You are an expert colour theory coach for artists. Always respond with ONLY valid JSON, no markdown, no backticks, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    if (!response.ok) return res.status(500).json({ error: `Anthropic error: ${responseText}` });

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const palette = JSON.parse(cleaned);
      return res.status(200).json(palette);
    } catch {
      return res.status(500).json({ error: 'Failed to parse palette response', rawResponse: cleaned });
    }
  } catch (error) {
    console.error('Palette generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
