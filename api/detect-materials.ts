import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, text } = req.body;
  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const userContent = image
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: 'What art materials do you see? Reply with ONLY a JSON array like: [{"name":"scissors","category":"tool","confidence":"high"}]' }
      ]
    : [{ type: 'text', text: `Extract art materials from: "${text}". Reply with ONLY a JSON array like: [{"name":"acrylic paint","category":"paint","confidence":"high"}]` }];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are an art materials identifier. Always respond with ONLY a valid JSON array, nothing else. No markdown, no explanation.',
      messages: [{ role: 'user', content: userContent }]
    })
  });

  const data = await response.json();
  console.log('Raw Claude response:', JSON.stringify(data));
  
  const rawText = data.content?.[0]?.text || '[]';
  console.log('Raw text:', rawText);
  
  try {
    const materials = JSON.parse(rawText);
    console.log('Parsed materials:', materials);
    return res.status(200).json({ materials });
  } catch (e) {
    console.log('Parse error, raw was:', rawText);
    return res.status(200).json({ materials: [], debug: rawText });
  }
}
