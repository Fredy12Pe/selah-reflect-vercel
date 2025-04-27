/**
 * Cookie utilities for client-side operations
 */

interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
}

/**
 * Set a cookie with the specified name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === 'undefined') return;

  const {
    path = '/',
    domain,
    maxAge,
    expires,
    sameSite = 'lax',
    secure = false,
    httpOnly = false,
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (path) cookieString += `; path=${path}`;
  if (domain) cookieString += `; domain=${domain}`;
  if (maxAge) cookieString += `; max-age=${maxAge}`;
  if (expires) cookieString += `; expires=${expires.toUTCString()}`;
  if (sameSite) cookieString += `; samesite=${sameSite}`;
  if (secure) cookieString += '; secure';
  if (httpOnly) cookieString += '; httponly';

  document.cookie = cookieString;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split('; ');
  const cookie = cookies.find(cookie => cookie.startsWith(`${encodeURIComponent(name)}=`));
  
  if (!cookie) return null;
  
  return decodeURIComponent(cookie.split('=')[1]);
}

/**
 * Clear a cookie by setting its expiration to the past
 */
export function clearCookie(name: string, options: Partial<CookieOptions> = {}) {
  if (typeof document === 'undefined') return;

  const { path = '/', domain } = options;
  
  const expires = new Date(0); // Set to epoch time - effectively deletes the cookie
  document.cookie = `${encodeURIComponent(name)}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=${expires.toUTCString()}`;
} 