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
  throw new Error('Could not extract JSON from response');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, text } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const imagePrompt = `Analyse this image carefully. Your job is to identify art and craft materials.

For COLOUR materials (paints, inks, dyes):
- Try to read the actual colour name off the tube/bottle/pan label (e.g. "Cadmium Yellow", "Cobalt Blue", "Burnt Sienna")
- If you can read the label clearly, use that exact colour name
- If you can see it's a colour medium but cannot read the label, use a generic name like "Watercolour (unknown colour)" — do NOT guess the colour

For CRAFT materials (clay, paper, tools, brushes, canvas etc.):
- List them normally by type

Return ONLY valid JSON, no markdown:
{
  "colourMaterials": [
    { "name": "Cadmium Yellow", "type": "acrylic", "labelRead": true }
  ],
  "craftMaterials": [
    { "name": "air dry clay", "category": "sculpting" },
    { "name": "flat brush", "category": "tool" }
  ],
  "capabilities": ["Painting", "Sculpting"]
}

capabilities must only include values from this list:
Sketching, Painting, Sculpting, Nature Crafts, Mixed Media, Journaling, Paper Craft, Calligraphy, Texture Art, Botanical Art, Character Design, Decorative Craft, Abstract Art, Miniature Art, DIY Home Decor`;

  const textPrompt = `Parse these art materials: "${text}"

For COLOUR materials — if the user specifies a colour name (e.g. "red acrylic", "cobalt blue watercolour", "cadmium yellow"), extract the colour name precisely.
If they just say a medium without a colour (e.g. "watercolours", "acrylic paint"), mark labelRead as false.

For CRAFT materials — everything that is not a colour medium (clay, paper, brushes, canvas, tools, etc.)

Return ONLY valid JSON, no markdown:
{
  "colourMaterials": [
    { "name": "Cobalt Blue", "type": "watercolour", "labelRead": true },
    { "name": "Watercolour (unknown colour)", "type": "watercolour", "labelRead": false }
  ],
  "craftMaterials": [
    { "name": "air dry clay", "category": "sculpting" }
  ],
  "capabilities": ["Painting", "Sculpting"]
}

capabilities must only include values from this list:
Sketching, Painting, Sculpting, Nature Crafts, Mixed Media, Journaling, Paper Craft, Calligraphy, Texture Art, Botanical Art, Character Design, Decorative Craft, Abstract Art, Miniature Art, DIY Home Decor`;

  const userContent = image
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: imagePrompt }
      ]
    : [{ type: 'text', text: textPrompt }];

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
        system: 'You are an expert art materials identifier. Always respond with ONLY valid JSON, no markdown, no explanation.',
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const responseText = await response.text();
    if (!response.ok) return res.status(500).json({ error: `Anthropic error: ${responseText}` });

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '{}';

    try {
      const result = extractJSON(rawText);

      const colourMaterials = result.colourMaterials || [];
      const craftMaterials = result.craftMaterials || [];
      const capabilities = result.capabilities || [];

      // Build flat materials array for backward compat with confirmation screen
      const materials = [
        ...colourMaterials.map((m: any) => ({ name: m.name, category: 'colour', confidence: m.labelRead ? 'high' : 'medium' })),
        ...craftMaterials.map((m: any) => ({ name: m.name, category: m.category || 'craft', confidence: 'high' })),
      ];

      if (materials.length === 0) {
        return res.status(200).json({ error: 'No materials detected', materials: [], colourMaterials: [], craftMaterials: [], capabilities: [] });
      }

      return res.status(200).json({ materials, colourMaterials, craftMaterials, capabilities });
    } catch {
      return res.status(500).json({ error: 'Failed to parse detection response', rawResponse: rawText.slice(0, 300) });
    }
  } catch (error) {
    console.error('Detection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
