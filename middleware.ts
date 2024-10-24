import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession();

  // Allow all auth routes to pass through
  if (req.nextUrl.pathname.startsWith('/auth')) {
    return res;
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/products'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/auth/:path*'
  ]
};
