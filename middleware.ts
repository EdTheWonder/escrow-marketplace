import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip middleware for public routes and auth-related paths
  const publicPaths = ['/', '/auth', '/feed'];
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return res;
  }

  // Check session
  const { data: { session } } = await supabase.auth.getSession();

  // Only redirect if trying to access protected routes without session
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
