/**
 * GET   /api/admin/bookings?status=&q=   list (auth via _middleware)
 * PATCH /api/admin/bookings              { id, status }  update status
 */
import { json } from './_auth.js';

const VALID = ['new', 'confirmed', 'done', 'cancelled'];

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const q = (url.searchParams.get('q') || '').trim();

  let sql = 'SELECT * FROM bookings';
  const where = [], binds = [];
  if (status && VALID.includes(status)) { where.push('status = ?'); binds.push(status); }
  if (q) { where.push('(name LIKE ? OR phone LIKE ? OR city LIKE ?)'); binds.push('%'+q+'%','%'+q+'%','%'+q+'%'); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY id DESC LIMIT 500';

  const { results } = await env.DB.prepare(sql).bind(...binds).all();

  const counts = {};
  const cr = await env.DB.prepare('SELECT status, COUNT(*) c FROM bookings GROUP BY status').all();
  (cr.results || []).forEach(r => { counts[r.status] = r.c; });

  return json({ ok: true, bookings: results, counts });
}

export async function onRequestPatch({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Invalid request' }, 400); }
  const id = parseInt(data.id, 10);
  const status = String(data.status || '');
  if (!id || !VALID.includes(status)) return json({ ok: false, error: 'Invalid id or status' }, 400);

  await env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ ok: true, id, status });
}
