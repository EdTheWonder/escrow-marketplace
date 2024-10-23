import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get user profile if session exists
    let userRole = null;
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        userRole = profile.role;
      }
    }

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }

      // Restrict seller-only routes
      if (
        (req.nextUrl.pathname.startsWith('/dashboard/products/new') ||
        req.nextUrl.pathname.startsWith('/products/new')) &&
        userRole !== 'seller'
      ) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Restrict buyer-only routes
      if (
        (req.nextUrl.pathname.startsWith('/cart') ||
        req.nextUrl.pathname.startsWith('/products')) &&
        userRole === 'seller'
      ) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Redirect logged-in users away from auth pages
    if (
      (req.nextUrl.pathname.startsWith('/auth/login') ||
        req.nextUrl.pathname.startsWith('/auth/signup')) &&
      session
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
  } catch (e) {
    // If there's an error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
