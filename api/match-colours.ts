import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { extractedColours, materials } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!extractedColours || !Array.isArray(extractedColours)) return res.status(400).json({ error: 'Extracted colours array required' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });

  const userPrompt = `Given these hex colours: ${extractedColours.join(', ')} and these materials: ${materials.join(', ')}, match each colour to determine if the user likely has it. For each colour, return: { hex: string, name: string, status: "have" | "need", matchedMaterial?: string }. If a hex colour closely matches a material (e.g. brown hex to "pressed leaves", green hex to "moss"), set status: "have" and include the matchedMaterial. If no close match, set status: "need". Return ONLY a JSON array of colour objects.`;

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
        system: 'You are an expert colour analyst. Always respond with ONLY valid JSON, no markdown, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    console.log('Colour matching response status:', response.status);

    if (!response.ok) {
      return res.status(500).json({ error: `Anthropic error: ${responseText}` });
    }

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '[]';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const colourMatches = JSON.parse(cleaned);
      return res.status(200).json(colourMatches);
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse', rawResponse: cleaned });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
