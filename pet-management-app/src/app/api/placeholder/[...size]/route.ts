import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ size: string[] }> }
) {
  try {
    const params = await context.params
    const sizeStr = params.size.join('/')
    const [width, height] = sizeStr.split('/').map(s => parseInt(s) || 400)

    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text 
          x="50%" 
          y="50%" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          font-family="Arial, sans-serif" 
          font-size="16" 
          fill="#6b7280"
        >
          ${width} × ${height}
        </text>
      </svg>
    `.trim()

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating placeholder:', error)
    
    // Fallback 1x1 transparent pixel
    const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    return new Response(pixel, {
      headers: {
        'Content-Type': 'image/gif',
      },
    })
  }
}