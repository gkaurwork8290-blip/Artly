import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers })
  }

  if (req.method !== 'POST') {
    return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    })
  }

  try {
    const body = await req.json()
    const { image, text } = body

    // Validate input
    if (!image && !text) {
      return new NextResponse(JSON.stringify({ error: 'No image or text provided' }), {
        status: 400,
        headers,
      })
    }

    const apiKey = process.env.VITE_CLAUDE_API_KEY
    if (!apiKey) {
      return new NextResponse(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers,
      })
    }

    // Prepare Claude API request
    let messages: any[] = []

    if (image) {
      // Image input
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: 'Analyse this image and identify the art materials visible.',
            },
          ],
        },
      ]
    } else if (text) {
      // Text input
      messages = [
        {
          role: 'user',
          content: `Analyse this description of art materials: "${text}"`,
        },
      ]
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        system: 'You are an art materials expert. Analyse the input and return ONLY a valid JSON array. Each item: { name: string, category: string, confidence: string }. Categories: paint, brush, paper, canvas, clay, ink, pencil, marker, tool, other. No other text, just the JSON array.',
        messages,
      }),
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      return new NextResponse(
        JSON.stringify({ error: `Claude API error: ${claudeResponse.status}` }),
        {
          status: claudeResponse.status,
          headers,
        }
      )
    }

    const claudeData = await claudeResponse.json()
    const content = claudeData.content[0]?.text

    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: 'No response content received' }),
        {
          status: 500,
          headers,
        }
      )
    }

    // Parse and validate JSON response
    let materials: any[]
    try {
      materials = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to parse API response' }),
        {
          status: 500,
          headers,
        }
      )
    }

    // Validate materials array
    if (!Array.isArray(materials)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid response format' }),
        {
          status: 500,
          headers,
        }
      )
    }

    // Return success response
    return new NextResponse(JSON.stringify({ materials }), {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Server error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers,
      }
    )
  }
}
