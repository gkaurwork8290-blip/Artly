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

  const imagePrompt = `Analyse this image carefully to identify art and craft materials.

COLOUR MEDIUMS — these ALWAYS go in colourMaterials, never craftMaterials:
watercolor, watercolour, acrylic paint, acrylic, gouache, oil paint, tempera, ink, pastel, chalk pastel, oil pastel, marker, sketch pen, colored pencil, coloured pencil, crayon, dye, pigment, poster color, fabric paint

For colour mediums:
- Try to read the actual colour name off the tube/bottle/pan label (e.g. "Cadmium Yellow", "Cobalt Blue")
- If you can read the label: set labelRead true and use the exact colour name
- If you CANNOT read the label but can see it is a colour medium: set labelRead false and use the medium name (e.g. "Watercolour", "Acrylic paint")
- NEVER put a colour medium in craftMaterials

CRAFT MATERIALS — everything that is NOT a colour medium:
clay, paper, canvas, brushes, palette, scissors, glue, tape, sketchbook, notebook, tools, wire, beads, fabric, wood, cardboard

Return ONLY valid JSON, no markdown:
{
  "colourMaterials": [
    { "name": "Cadmium Yellow", "type": "acrylic", "labelRead": true },
    { "name": "Watercolour", "type": "watercolour", "labelRead": false }
  ],
  "craftMaterials": [
    { "name": "flat brush", "category": "tool" },
    { "name": "canvas", "category": "surface" }
  ],
  "capabilities": ["Painting"]
}

capabilities must only be from: Sketching, Painting, Sculpting, Nature Crafts, Mixed Media, Journaling, Paper Craft, Calligraphy, Texture Art, Botanical Art, Character Design, Decorative Craft, Abstract Art, Miniature Art, DIY Home Decor`;

  const textPrompt = `Parse these art materials and classify them correctly: "${text}"

CRITICAL RULE — COLOUR MEDIUMS always go in colourMaterials, NEVER in craftMaterials:
- watercolor / watercolour / watercolors = colourMaterial, labelRead: false
- acrylic / acrylic paint = colourMaterial, labelRead: false
- gouache, oil paint, tempera, ink, pastel, chalk pastel, oil pastel = colourMaterial, labelRead: false
- marker, sketch pen, colored pencil, coloured pencil, crayon = colourMaterial, labelRead: false
- "red acrylic", "cobalt blue watercolour", "burnt sienna" = colourMaterial, labelRead: true, use the colour name

CRAFT MATERIALS — only non-colour items:
brushes, canvas, paper, clay, sketchbook, palette, scissors, tools, tape, glue, etc.

Examples:
- "watercolors, brushes, paper" → watercolors = colourMaterial (labelRead:false), brushes+paper = craftMaterials
- "cobalt blue, burnt sienna, canvas" → cobalt blue + burnt sienna = colourMaterials (labelRead:true), canvas = craftMaterial
- "air dry clay, acrylic paint" → acrylic paint = colourMaterial (labelRead:false), air dry clay = craftMaterial
- "markers, sketchbook" → markers = colourMaterial (labelRead:false), sketchbook = craftMaterial

Return ONLY valid JSON, no markdown:
{
  "colourMaterials": [
    { "name": "Watercolour", "type": "watercolour", "labelRead": false }
  ],
  "craftMaterials": [
    { "name": "brushes", "category": "tool" },
    { "name": "paper", "category": "surface" }
  ],
  "capabilities": ["Painting"]
}

capabilities must only be from: Sketching, Painting, Sculpting, Nature Crafts, Mixed Media, Journaling, Paper Craft, Calligraphy, Texture Art, Botanical Art, Character Design, Decorative Craft, Abstract Art, Miniature Art, DIY Home Decor`;

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
        system: 'You are an expert art materials classifier. Colour mediums (watercolour, acrylic, gouache, ink, pastel, marker, etc.) ALWAYS go in colourMaterials — never in craftMaterials. Always respond with ONLY valid JSON, no markdown.',
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
