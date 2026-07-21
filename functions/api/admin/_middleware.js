/**
 * Guards every /api/admin/* route except the login endpoint.
 * Verifies the signed session cookie and attaches the user to context.data.
 */
import { verifyToken, readCookie, COOKIE_NAME, json } from './_auth.js';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // login is public (it issues the cookie)
  if (url.pathname === '/api/admin/login') return next();

  const token = readCookie(request, COOKIE_NAME);
  const session = token ? await verifyToken(context.env, token) : null;
  if (!session) {
    return json({ ok: false, error: 'Not authenticated' }, 401);
  }
  context.data.user = session;
  return next();
}
