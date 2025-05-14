import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserSession, type UserSession } from '@/lib/auth';
import { 
  PUBLIC_PATHS, 
  DEFAULT_REDIRECT_PATH, 
  ADMIN_DASHBOARD_PATH, 
  EMPLOYEE_PROFILE_PATH 
} from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getUserSession(request.cookies);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (session) {
    // If user is logged in and tries to access login/register, redirect them
    if (isPublicPath) {
      return NextResponse.redirect(new URL(getRedirectPath(session), request.url));
    }

    // Role-based access control for specific paths
    if (pathname.startsWith(ADMIN_DASHBOARD_PATH) && session.role !== 'admin') {
      // If non-admin tries to access admin routes, redirect to their default page
      return NextResponse.redirect(new URL(getRedirectPath(session), request.url));
    }
    
    // If employee tries to access a non-profile page (example, can be expanded)
    if (session.role === 'employee' && pathname !== EMPLOYEE_PROFILE_PATH && !pathname.startsWith('/api')) {
        // This logic might need refinement depending on how many distinct pages an employee can access.
        // For now, an employee trying to access anything other than their profile (and not an API route) gets redirected.
        // If employees have more accessible routes, this condition needs to be more specific.
    }

  } else {
    // If user is not logged in and tries to access a protected path, redirect to login
    if (!isPublicPath) {
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

function getRedirectPath(session: UserSession | null): string {
  if (!session) return '/login';
  return session.role === 'admin' ? ADMIN_DASHBOARD_PATH : EMPLOYEE_PROFILE_PATH;
}

export const config = {
  matcher: [
    // Match all routes except for static files and _next
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
