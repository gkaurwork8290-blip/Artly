import type { VercelRequest, VercelResponse } from '@vercel/node';

// Colour mediums — if detected, we suggest a palette even without specific colour names
const COLOUR_MEDIUMS = [
  'watercolor', 'watercolour', 'watercolors', 'watercolours',
  'acrylic', 'acrylic paint', 'acrylics',
  'gouache', 'oil paint', 'oil paints', 'oils',
  'tempera', 'poster color', 'poster colour',
  'ink', 'inks', 'drawing ink',
  'pastel', 'pastels', 'chalk pastel', 'oil pastel',
  'marker', 'markers', 'sketch pen', 'sketch pens',
  'colored pencil', 'coloured pencil', 'colored pencils', 'coloured pencils',
  'crayon', 'crayons', 'dye', 'pigment',
]

function isColourMedium(name: string): boolean {
  const lower = name.toLowerCase()
  return COLOUR_MEDIUMS.some(m => lower.includes(m))
}

// Check if a material name contains a specific colour (e.g. "Cobalt Blue", "red acrylic")
const COLOUR_WORDS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'violet', 'pink',
  'brown', 'black', 'white', 'grey', 'gray', 'cyan', 'magenta',
  'cobalt', 'cadmium', 'burnt', 'raw', 'sienna', 'umber', 'ochre',
  'crimson', 'scarlet', 'navy', 'teal', 'indigo', 'turquoise',
  'titanium', 'zinc', 'ivory', 'cream', 'gold', 'silver',
]

function hasSpecificColour(name: string): boolean {
  const lower = name.toLowerCase()
  return COLOUR_WORDS.some(c => lower.includes(c))
}

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

  const { materials, ideaTitle, ideaSteps } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });

  // Separate exact colours from generic mediums
  const exactColours = materials.filter((m: string) => hasSpecificColour(m))
  const genericMediums = materials.filter((m: string) => isColourMedium(m) && !hasSpecificColour(m))

  let paletteInstruction = ''

  if (exactColours.length > 0 && genericMediums.length === 0) {
    // User has specific colours — use only those
    paletteInstruction = `The artist has these EXACT colours: ${exactColours.join(', ')}.
Use ONLY these colours in the palette. Do not invent or add new colours.
Pick the 4-6 most relevant ones for this specific project.`
  } else if (exactColours.length > 0) {
    // Mix of exact + generic
    paletteInstruction = `The artist has these confirmed colours: ${exactColours.join(', ')}, plus these colour mediums: ${genericMediums.join(', ')}.
Use the confirmed colours and suggest 2-3 complementary colours that would work well with them for this project.`
  } else {
    // Only generic mediums (e.g. "watercolours", "acrylic paint") — suggest appropriate palette
    paletteInstruction = `The artist has these colour mediums: ${genericMediums.join(', ')}, but no specific colours confirmed.
Suggest a palette of 4-5 colours that work beautifully for this specific project.
Choose colours that match the mood and subject of the project title.
Examples: landscape = sky blues, earthy greens, warm ochres; portrait = flesh tones, warm browns; abstract = bold complementary pairs.`
  }

  const userPrompt = `Art project: "${ideaTitle || 'General artwork'}"
${ideaSteps && ideaSteps.length > 0 ? `Project steps: ${ideaSteps.slice(0, 3).join('; ')}` : ''}

${paletteInstruction}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "colors": [
    { "name": "string — specific colour name e.g. Cobalt Blue", "hex": "#xxxxxx" }
  ],
  "mixHint": "string — one short practical mixing or colour usage tip e.g. Mix Cobalt Blue + Titanium White for soft sky tones"
}

The hex values must visually match the named colour exactly. The mixHint must reference 2-3 actual colour names from the palette.`;

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

    try {
      const palette = extractJSON(rawText);
      return res.status(200).json(palette);
    } catch {
      return res.status(500).json({ error: 'Failed to parse palette response', rawResponse: rawText.slice(0, 300) });
    }
  } catch (error) {
    console.error('Palette generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
