import type { VercelRequest, VercelResponse } from '@vercel/node';

function extractJSON(text: string): any {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
    try { return JSON.parse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1')); } catch {}
  }
  throw new Error('Could not extract JSON');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { colourMaterials, ideaTitle, ideaSteps } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!colourMaterials || !Array.isArray(colourMaterials)) return res.status(400).json({ error: 'colourMaterials array required' });

  const exactColours = colourMaterials.filter((m: any) => m.labelRead).map((m: any) => m.name);
  const genericMediums = colourMaterials.filter((m: any) => !m.labelRead).map((m: any) => m.name);

  const paletteSource = exactColours.length > 0
    ? `Use ONLY these confirmed colours: ${exactColours.join(', ')}. Do not invent new colours.`
    : `The artist has these colour mediums with no confirmed colours: ${genericMediums.join(', ')}. Suggest a palette of 4-5 colours that work well for: "${ideaTitle}".`;

  const userPrompt = `Art project: "${ideaTitle || 'General artwork'}"
${ideaSteps && ideaSteps.length > 0 ? `Project steps: ${ideaSteps.slice(0, 3).join('; ')}` : ''}

${paletteSource}

Return a colour palette of 4-6 colours and one short mixing hint.

Return ONLY valid JSON:
{
  "colors": [
    { "name": "Cobalt Blue", "hex": "#0047AB" }
  ],
  "mixHint": "Mix Cobalt Blue + Titanium White for soft sky tones"
}`;

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
        system: 'You are an expert colour theory coach. Always respond with ONLY valid JSON, no markdown, no backticks, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    if (!response.ok) return res.status(500).json({ error: `Anthropic error: ${responseText}` });

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '{}';

    try {
      const palette = extractJSON(rawText);
      return res.status(200).json(palette);
    } catch {
      return res.status(500).json({ error: 'Failed to parse palette response', rawResponse: rawText.slice(0, 300) });
    }
  } catch (error) {
    console.error('Palette error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
