import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Log environment variable status (debug only)
    console.debug('Environment variables status:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl?.substring(0, 10) + '...',
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables in middleware');
      // Don't throw error, just return response to prevent blocking the request
      return res;
    }

    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession();

    return res;
  } catch (e) {
    console.error('Middleware error:', e);
    // Don't throw error, just return response to prevent blocking the request
    return res;
  }
}

// Update matcher to exclude api routes and static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 