import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { AUTH_COOKIE_NAME } from './constants';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export async function getUserSession(cookieStore?: ReadonlyRequestCookies): Promise<UserSession | null> {
  const store = cookieStore || cookies();
  const sessionCookie = store.get(AUTH_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      // Basic validation, in a real app, you'd verify a token
      if (session.id && session.name && session.email && session.role) {
        return session as UserSession;
      }
    } catch (error) {
      console.error('Failed to parse session cookie:', error);
      // Clear invalid cookie
      store.delete(AUTH_COOKIE_NAME);
      return null;
    }
  }
  return null;
}

export async function setUserSession(user: UserSession) {
  cookies().set(AUTH_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  });
}

export async function clearUserSession() {
  cookies().delete(AUTH_COOKIE_NAME);
}
