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

  const { materials, skillLevel, theme } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!materials || !Array.isArray(materials)) return res.status(400).json({ error: 'Materials array required' });
  if (!skillLevel) return res.status(400).json({ error: 'Skill level required' });

  const normalisedSkill = normaliseSkill(skillLevel);
  const themeText = theme ? ` Theme or mood: ${theme}.` : '';

  const skillGuidance = {
    beginner: `The artist is a BEGINNER. Ideas must be:
- Simple, achievable in one sitting
- Use basic techniques only (no blending, layering, or complex construction)
- Minimal steps, very forgiving materials
- Encouraging and confidence-building
- Examples: simple stamping, basic shapes, single-layer painting, easy paper crafts, simple clay pinch pots, vegetable stamping, food printing`,
    intermediate: `The artist is INTERMEDIATE. Ideas must be:
- Moderately challenging with clear technique progression
- Involve 2-3 combined techniques (e.g. sketching + watercolour wash, layering colours)
- Multi-step projects that take 1-3 hours
- Some room for creative decision-making
- Examples: layered watercolours, mixed media collage, structured clay forms, food still life, natural dye experiments`,
    advanced: `The artist is ADVANCED or PROFESSIONAL. Ideas must be:
- Technically demanding and creatively ambitious
- Involve complex techniques (detailed shading, intricate construction, multi-layer finishing)
- Projects that take multiple sessions or deep focus
- Assume mastery of the materials listed
- Examples: complex sculptural forms, detailed portraiture, experimental mixed media, fine finishing work, hyperrealistic food illustration`,
  }[normalisedSkill];

  const userPrompt = `Generate 3 creative project ideas for an artist with these materials: ${materials.join(', ')}.${themeText}

${skillGuidance}

Return ONLY a valid JSON array with no markdown, no explanation:
[{
  "title": "string",
  "description": "string — 2 sentences, tailored to the skill level",
  "difficulty": "${normalisedSkill}",
  "estimatedTime": "string e.g. 45 minutes or 2-3 hours",
  "materialsUsed": "string — short summary e.g. Uses your brushes, paper, and paints",
  "steps": [
    {
      "title": "string — short action e.g. Arrange your leaves",
      "description": "string — 1-2 sentences explaining what to do, appropriate for a ${normalisedSkill} artist",
      "tip": "string — one practical tip for this step"
    }
  ]
}]

Generate 4-6 steps per idea. Steps must be practical, specific to the materials listed, and calibrated for a ${normalisedSkill} artist. Do not suggest techniques beyond their skill level.`;

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
        system: 'You are a creative art coach. Always respond with ONLY a valid JSON array, no markdown, no backticks, no explanation. Strictly match idea complexity to the artist\'s skill level.',
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
