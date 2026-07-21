/**
 * POST /api/admin/login  { username, password }
 * Verifies against ADMIN_USER / ADMIN_PASSWORD env vars, issues a signed cookie.
 * GET  /api/admin/login  -> { ok, authed } to check current session (used by the SPA)
 */
import { makeToken, sessionCookie, verifyToken, readCookie, COOKIE_NAME, json } from './_auth.js';

const DAY = 86400;

// constant-time string compare
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  const token = readCookie(request, COOKIE_NAME);
  const session = token ? await verifyToken(env, token) : null;
  return json({ ok: true, authed: !!session, user: session ? session.u : null });
}

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Invalid request' }, 400); }

  const user = String(data.username || '').trim();
  const pass = String(data.password || '');

  const ADMIN_USER = env.ADMIN_USER || 'laveena';
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    return json({ ok: false, error: 'Admin password not configured on the server.' }, 500);
  }
  if (!safeEqual(user.toLowerCase(), ADMIN_USER.toLowerCase()) || !safeEqual(pass, ADMIN_PASSWORD)) {
    return json({ ok: false, error: 'Incorrect username or password.' }, 401);
  }

  const exp = Date.now() + 7 * DAY * 1000;
  const token = await makeToken(env, { u: ADMIN_USER, exp });
  return json({ ok: true, user: ADMIN_USER }, 200, { 'Set-Cookie': sessionCookie(token, 7 * DAY) });
}
