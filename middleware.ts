import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow auth routes to pass through
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }

  // Protect dashboard and product routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/products')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // For seller-only routes, check the user role
    if (req.nextUrl.pathname.startsWith('/products')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'seller') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
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
