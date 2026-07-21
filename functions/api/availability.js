/** GET /api/availability -> { blocked: ["YYYY-MM-DD", ...] } public, for the booking calendar */
export async function onRequestGet({ env }) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' };
  if (!env.DB) return new Response(JSON.stringify({ blocked: [] }), { headers });
  try {
    const { results } = await env.DB.prepare("SELECT date FROM blocked_dates WHERE date >= date('now')").all();
    return new Response(JSON.stringify({ blocked: (results||[]).map(r => r.date) }), { headers });
  } catch {
    return new Response(JSON.stringify({ blocked: [] }), { headers });
  }
}
