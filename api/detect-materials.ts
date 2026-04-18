import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('API')));
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, text } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const userContent = image
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: 'What art materials do you see? Reply with ONLY a JSON array like: [{"name":"scissors","category":"tool","confidence":"high"}]' }
      ]
    : [{ type: 'text', text: `Extract art materials from: "${text}". Reply with ONLY a JSON array like: [{"name":"acrylic paint","category":"paint","confidence":"high"}]` }];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are an art materials identifier. Always respond with ONLY a valid JSON array, nothing else. No markdown, no explanation.',
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: `API request failed: ${response.status}` });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '[]';
    
    try {
      const materials = JSON.parse(rawText);
      return res.status(200).json({ materials });
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse API response', rawResponse: rawText });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
