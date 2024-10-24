import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip middleware for public routes
  if (
    req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname.startsWith('/auth') ||
    req.nextUrl.pathname.startsWith('/feed')
  ) {
    return res;
  }

  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if no session and trying to access protected routes
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
