import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If environment variables are missing, redirect to an error page or show a message
    if (!supabaseUrl || !supabaseAnonKey) {
      // For now, just return the response and let the client handle the error state
      return res;
    }

    // Create a Supabase client configured to use cookies
    const supabase = createServerClient<Database>(
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

    try {
      // Refresh session if expired - required for Server Components
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and not on auth page, redirect to auth
      if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/auth', req.url));
      }

      // If has session and on auth page, redirect to app
      if (session && req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch (error) {
      console.warn('Error refreshing auth session:', error);
      // Continue even if session refresh fails
    }

    return res;
  } catch (e) {
    console.warn('Middleware error:', e);
    // Return the response even if there's an error
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