/**
 * DamnLove Makeup — bookings API (Cloudflare Pages Function + D1)
 *
 * POST /api/bookings           create a booking          (public)
 * GET  /api/bookings?token=..  list recent bookings      (admin, ADMIN_TOKEN env var)
 */

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Database not configured' }, 500);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }

    // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
    if (data.website && String(data.website).trim() !== '') {
      return json({ ok: true, id: null });
    }

    const required = ['date', 'slot', 'occasion', 'name', 'phone'];
    for (const k of required) {
      if (!data[k] || String(data[k]).trim() === '') {
        return json({ ok: false, error: 'Missing field: ' + k }, 400);
      }
    }

    // Basic validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
      return json({ ok: false, error: 'Invalid date' }, 400);
    }
    const phone = String(data.phone).replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) {
      return json({ ok: false, error: 'Invalid phone number' }, 400);
    }

    const clip = (v, n) => String(v ?? '').trim().slice(0, n);

    const result = await env.DB.prepare(
      `INSERT INTO bookings (event_date, time_slot, occasion, name, phone, city, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`
    )
      .bind(
        clip(data.date, 10),
        clip(data.slot, 60),
        clip(data.occasion, 60),
        clip(data.name, 120),
        phone,
        clip(data.city, 160),
        clip(data.notes, 1000)
      )
      .run();

    return json({ ok: true, id: result.meta.last_row_id });
  } catch (err) {
    return json({ ok: false, error: 'Server error' }, 500);
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  const { results } = await env.DB.prepare(
    'SELECT * FROM bookings ORDER BY id DESC LIMIT 500'
  ).all();
  return json({ ok: true, count: results.length, bookings: results });
}
