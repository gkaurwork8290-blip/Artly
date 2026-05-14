import type { VercelRequest, VercelResponse } from '@vercel/node';

function normaliseSkill(skill: string): 'beginner' | 'intermediate' | 'advanced' {
  const s = (skill || '').toLowerCase().trim();
  if (s === 'intermediate') return 'intermediate';
  if (s === 'advanced' || s === 'professional') return 'advanced';
  return 'beginner';
}

function extractJSON(text: string): any[] {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const wrappedMatch = cleaned.match(/"ideas"\s*:\s*(\[[\s\S]*\])/);
  if (wrappedMatch) cleaned = wrappedMatch[1].trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.ideas && Array.isArray(parsed.ideas)) return parsed.ideas;
  } catch {}
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    try { const p = JSON.parse(slice); if (Array.isArray(p)) return p; } catch {}
    try { const p = JSON.parse(slice.replace(/,\s*([}\]])/g, '$1')); if (Array.isArray(p)) return p; } catch {}
  }
  throw new Error('Could not extract valid JSON array from response');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { materials, skillLevel, colourMaterials, craftMaterials, capabilities } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });
  if (!skillLevel) return res.status(400).json({ error: 'Skill level required' });

  const normalisedSkill = normaliseSkill(skillLevel);

  // Determine what kind of materials we have
  const hasColours = colourMaterials && colourMaterials.length > 0;
  const hasCraft = craftMaterials && craftMaterials.length > 0;

  // Colour names for palette — exact if labelRead, else Claude suggests appropriate ones
  const exactColours = hasColours
    ? colourMaterials.filter((m: any) => m.labelRead).map((m: any) => m.name)
    : [];
  const genericColourMediums = hasColours
    ? colourMaterials.filter((m: any) => !m.labelRead).map((m: any) => m.name)
    : [];

  const skillGuidance = {
    beginner: `The artist is a BEGINNER:
- Simple, achievable in one sitting
- Basic techniques only — no complex blending, layering, or construction
- Very forgiving, confidence-building
- Craft examples: trinket tray, simple fridge magnet, small pinch pot, flat leaf print
- Painting examples: single wash, simple shapes, one-colour study`,
    intermediate: `The artist is INTERMEDIATE:
- Moderately challenging, 1-3 hours
- 2-3 combined techniques
- Craft examples: phone holder, tissue box cover, small sculpture, decorative bowl
- Painting examples: layered wash, mixed technique, composition with foreground/background`,
    advanced: `The artist is ADVANCED or PROFESSIONAL:
- Technically demanding, multi-session work
- Complex construction or detailed technique
- Craft examples: intricate sculptural form, functional art piece, multi-part assembly
- Painting examples: detailed portraiture, complex composition, experimental mixed media`,
  }[normalisedSkill];

  // Build palette instruction
  let paletteInstruction = '';
  if (hasColours) {
    if (exactColours.length > 0 && genericColourMediums.length === 0) {
      paletteInstruction = `PALETTE RULES:
- The artist has these EXACT colours: ${exactColours.join(', ')}
- Use ONLY these exact colours in the palette — do not invent new ones
- Each step that uses colour must reference the specific colour by name (e.g. "Apply Cobalt Blue as the base wash")
- palette field must list only colours from: ${exactColours.join(', ')}`;
    } else if (exactColours.length > 0) {
      paletteInstruction = `PALETTE RULES:
- The artist has these confirmed colours: ${exactColours.join(', ')}
- They also have these colour mediums with unknown specific colours: ${genericColourMediums.join(', ')}
- For the palette, use the confirmed colours and suggest 2-3 complementary colours appropriate for the project
- Label suggested colours clearly in mixHint
- Each step that uses colour must reference specific colour names`;
    } else {
      paletteInstruction = `PALETTE RULES:
- The artist has colour mediums but no specific colours confirmed: ${genericColourMediums.join(', ')}
- Suggest a palette of 4-5 colours that work well for each specific project (e.g. for a landscape: Cobalt Blue, Burnt Sienna, Yellow Ochre, Titanium White)
- Each step that uses colour must reference the suggested colour by name`;
    }
  } else {
    paletteInstruction = `PALETTE RULES:
- No colour materials detected — this is a pure craft project
- Set palette to [] and mixHint to "" for all ideas
- Do NOT mention colours in steps`;
  }

  // Build capability context
  const capabilityContext = capabilities && capabilities.length > 0
    ? `Detected creative capabilities: ${capabilities.join(', ')}`
    : '';

  const craftContext = hasCraft
    ? `Craft materials: ${craftMaterials.map((m: any) => m.name).join(', ')}`
    : '';

  const colourContext = hasColours
    ? `Colour materials: ${colourMaterials.map((m: any) => m.name).join(', ')}`
    : '';

  const userPrompt = `Generate 3 creative project ideas for an artist.

${capabilityContext}
${colourContext}
${craftContext}
All materials: ${materials.join(', ')}

${skillGuidance}

${paletteInstruction}

Return ONLY a valid JSON array, no markdown, no explanation:
[{
  "title": "string",
  "description": "string — 2 sentences tailored to skill level",
  "difficulty": "${normalisedSkill}",
  "estimatedTime": "string e.g. 45 minutes or 2-3 hours",
  "materialsUsed": "string — short summary of which materials this idea uses",
  "palette": [
    { "name": "string — specific colour name", "hex": "#xxxxxx" }
  ],
  "mixHint": "string — one short mixing or colour usage tip, or empty string if no colours",
  "steps": [
    {
      "title": "string — short action title",
      "description": "string — 1-2 sentences, references specific colour names if applicable",
      "tip": "string — one practical tip"
    }
  ]
}]

Generate 4-6 steps per idea. Ideas must be practical and specific to the detected materials and capabilities.`;

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
        max_tokens: 3000,
        system: 'You are a creative art coach for Artly. Always respond with ONLY a valid JSON array, no markdown, no backticks, no explanation. Match complexity to skill level. Use exact colour names in steps when colours are available.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    if (!response.ok) return res.status(500).json({ error: `Anthropic error: ${responseText}` });

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '';
    if (!rawText) return res.status(500).json({ error: 'Empty response from Claude' });

    try {
      const ideas = extractJSON(rawText);
      return res.status(200).json({ ideas });
    } catch {
      return res.status(500).json({ error: 'Failed to parse ideas response', rawResponse: rawText.slice(0, 500) });
    }
  } catch (error) {
    console.error('Ideas generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
