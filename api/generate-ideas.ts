import type { VercelRequest, VercelResponse } from '@vercel/node';

function normaliseSkill(skill: string): 'beginner' | 'intermediate' | 'advanced' {
  const s = (skill || '').toLowerCase().trim();
  if (s === 'intermediate') return 'intermediate';
  if (s === 'advanced' || s === 'professional') return 'advanced';
  return 'beginner'; // beginner, hobbyist, or anything else
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
  const userPrompt = `Generate 3 creative project ideas for an artist with these materials: ${materials.join(', ')}. Skill level: ${normalisedSkill}.${themeText}

Return ONLY a valid JSON array with no markdown, no explanation:
[{
  "title": "string",
  "description": "string — 2 sentences",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedTime": "string e.g. 45 minutes or 2-3 hours",
  "materialsUsed": "string — short summary e.g. Uses your brushes, paper, and paints",
  "steps": [
    {
      "title": "string — short action e.g. Arrange your leaves",
      "description": "string — 1-2 sentences explaining what to do",
      "tip": "string — one practical tip for this step"
    }
  ]
}]

Generate 4-6 steps per idea. Steps must be practical and specific to the materials listed.`;

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
        max_tokens: 2048,
        system: 'You are a creative art coach. Always respond with ONLY a valid JSON array, no markdown, no backticks, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    if (!response.ok) return res.status(500).json({ error: `Anthropic error: ${responseText}` });

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '[]';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const ideas = JSON.parse(cleaned);
      return res.status(200).json({ ideas });
    } catch {
      return res.status(500).json({ error: 'Failed to parse ideas response', rawResponse: cleaned });
    }
  } catch (error) {
    console.error('Ideas generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
