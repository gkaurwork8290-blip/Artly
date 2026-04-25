import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  if (!skillLevel || !['beginner', 'intermediate', 'advanced'].includes(skillLevel)) return res.status(400).json({ error: 'Valid skill level required' });

  const themeText = theme ? ` Theme: ${theme}.` : '';
  const userPrompt = `Generate 3 creative project ideas for an artist with these materials: ${materials.join(', ')}. Skill level: ${skillLevel}.${themeText} Return ONLY a JSON array: [{ title, description, difficulty, estimatedTime, steps: string[] }]`;

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
        system: 'You are a creative art coach. Always respond with ONLY a valid JSON array, no markdown, no explanation.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const responseText = await response.text();
    console.log('Ideas generation response status:', response.status);

    if (!response.ok) {
      return res.status(500).json({ error: `Anthropic error: ${responseText}` });
    }

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text || '[]';
    const cleaned = rawText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    try {
      const ideas = JSON.parse(cleaned);
      return res.status(200).json({ ideas });
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: cleaned.slice(0, 200) });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
