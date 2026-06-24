import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Basic CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: http: https:; connect-src 'self' http://localhost:* ws://localhost:*"
  );

  // 2. Block access to sensitive files
  if (
    pathname.endsWith('.env') ||
    pathname.endsWith('.sql') ||
    pathname.endsWith('.log') ||
    pathname.endsWith('.bak') ||
    pathname.endsWith('.yml') ||
    pathname.endsWith('.yaml') ||
    pathname.endsWith('.toml') ||
    pathname.includes('.git/')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // 3. Route Protection
  const publicPaths = ['/signin', '/signup', '/forgot-password', '/reset-password', '/api'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  
  const token = request.cookies.get('token')?.value;

  // Si on est sur une route protégée et qu'on n'a pas de token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Si on est sur la page de connexion et qu'on a déjà un token
  if (pathname === '/signin' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
