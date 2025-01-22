import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  // For API routes, handle CORS
  if (req.nextUrl.pathname.startsWith('/api')) {
    console.log('API Middleware - Method:', req.method);
    console.log('API Middleware - URL:', req.url);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For API routes, add CORS headers and continue
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // For non-API routes, handle auth
  const res = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get: (name) => req.cookies.get(name)?.value,
          set: (name, value, options) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name, options) => {
            res.cookies.delete({ name, ...options });
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();

    // Handle auth redirects
    if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  } catch (e) {
    console.error('Middleware error:', e);
    // On error, redirect to auth page
    return NextResponse.redirect(new URL('/auth', req.url));
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Include API routes
    '/api/:path*',
    // Include all pages except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 