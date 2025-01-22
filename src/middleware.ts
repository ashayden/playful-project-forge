import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Only handle API routes
  if (!req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Log request details
  console.log('API Request:', {
    method: req.method,
    url: req.url,
    pathname: req.nextUrl.pathname
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // For all other requests
  const response = NextResponse.next();
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
} 