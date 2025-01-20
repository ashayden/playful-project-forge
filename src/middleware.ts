import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { Session } from '@supabase/supabase-js';

// Extend Express Request type
declare module 'express' {
  interface Request {
    session?: Session | null;
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // If the user is not signed in and the current path is not /auth,
    // redirect to /auth
    if (!session && !req.path.startsWith('/auth')) {
      return res.redirect('/auth');
    }

    // If the user is signed in and the current path is /auth,
    // redirect to /chat
    if (session && req.path.startsWith('/auth')) {
      return res.redirect('/chat');
    }

    // Add session to request for use in route handlers
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 