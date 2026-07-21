/**
 * Shared admin auth helpers (HMAC-signed session cookie).
 * Files beginning with "_" are NOT turned into routes by Cloudflare Pages.
 */
const COOKIE = 'dlm_admin';
const enc = (str) => new TextEncoder().encode(str);

function b64urlFromBytes(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secretOf(env) {
  return env.SESSION_SECRET || env.ADMIN_PASSWORD || 'dlm-dev-secret-change-me';
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', key, enc(data));
}

export async function makeToken(env, payload) {
  const body = b64urlFromBytes(enc(JSON.stringify(payload)));
  const sig = b64urlFromBytes(await hmac(body, secretOf(env)));
  return body + '.' + sig;
}

export async function verifyToken(env, token) {
  if (!token || token.indexOf('.') === -1) return null;
  const [body, sig] = token.split('.');
  const expected = b64urlFromBytes(await hmac(body, secretOf(env)));
  // constant-time-ish compare
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function sessionCookie(token, maxAgeSec) {
  const parts = [
    COOKIE + '=' + encodeURIComponent(token),
    'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/',
    'Max-Age=' + maxAgeSec,
  ];
  return parts.join('; ');
}
export function clearCookie() {
  return COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}
export const COOKIE_NAME = COOKIE;

export function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}
