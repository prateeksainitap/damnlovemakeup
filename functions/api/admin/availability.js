/**
 * GET    /api/admin/availability            list blocked dates (auth)
 * POST   /api/admin/availability { date, reason }   block a date
 * DELETE /api/admin/availability { date }    unblock a date
 */
import { json } from './_auth.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);
  const { results } = await env.DB.prepare('SELECT * FROM blocked_dates ORDER BY date ASC').all();
  return json({ ok: true, blocked: results });
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);
  let d; try { d = await request.json(); } catch { return json({ ok:false, error:'Invalid request' }, 400); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date||''))) return json({ ok:false, error:'Invalid date' }, 400);
  await env.DB.prepare('INSERT OR REPLACE INTO blocked_dates (date, reason, created_at) VALUES (?, ?, datetime(\'now\'))')
    .bind(d.date, String(d.reason||'').slice(0,120)).run();
  return json({ ok: true, date: d.date });
}
export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);
  // date can arrive via body OR ?date= query (robust against proxies that strip DELETE bodies)
  let date = new URL(request.url).searchParams.get('date') || '';
  if (!date) { try { const d = await request.json(); date = String(d.date || ''); } catch {} }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ ok:false, error:'Invalid date' }, 400);
  await env.DB.prepare('DELETE FROM blocked_dates WHERE date = ?').bind(date).run();
  return json({ ok: true, date });
}
