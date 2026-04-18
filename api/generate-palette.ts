import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { materials } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });

  const userPrompt = `Based on these art materials: ${materials.join(', ')}, generate a color palette. Return ONLY a JSON object: { colors: [{ name, hex, materialSource, mixingNotes }], complementaryPairs: [{ color1, color2, useCase }], harmoniousCombinations: string[] }`;

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
        system: 'You are an expert color theory coach for artists. Always respond with ONLY valid JSON, no markdown, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    console.log('Palette generation response status:', response.status);

    if (!response.ok) {
      return res.status(500).json({ error: `Anthropic error: ${responseText}` });
    }

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const palette = JSON.parse(cleaned);
      return res.status(200).json(palette);
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse', rawResponse: cleaned });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
