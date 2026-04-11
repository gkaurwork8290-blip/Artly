export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, text } = req.body;
  const apiKey = process.env.VITE_CLAUDE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const content = image
    ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
       { type: 'text', text: 'List the art materials you see. Return ONLY a JSON array: [{"name":"...","category":"...","confidence":"high/medium/low"}]' }]
    : [{ type: 'text', text: `Art materials in this description: "${text}". Return ONLY a JSON array: [{"name":"...","category":"...","confidence":"high/medium/low"}]` }];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content }] })
  });

  const data = await response.json();
  const text_response = data.content?.[0]?.text || '[]';
  
  let materials;
  try {
    // Remove markdown code blocks and parse JSON
    const cleanedResponse = text_response.replace(/```json|```/g, '').trim();
    console.log('Cleaned response:', cleanedResponse);
    materials = JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError);
    console.error('Raw response:', text_response);
    return res.status(500).json({ 
      error: 'Failed to parse materials response',
      rawResponse: text_response
    });
  }
  
  return res.status(200).json({ materials });
}
