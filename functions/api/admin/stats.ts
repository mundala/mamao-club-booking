interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const password = context.request.headers.get('X-Admin-Password');
  if (!password || password !== context.env.ADMIN_PASSWORD) {
    return unauthorized();
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const weekStart = monday.toISOString().split('T')[0];

    const [totalResult, todayResult, weekResult, popularTimeResult, cancelledResult, assignedResult] = await Promise.all([
      context.env.DB.prepare('SELECT COUNT(*) as total, COALESCE(SUM(guests), 0) as total_guests FROM bookings').first(),
      context.env.DB.prepare('SELECT COUNT(*) as total, COALESCE(SUM(guests), 0) as total_guests FROM bookings WHERE date = ?').bind(today).first(),
      context.env.DB.prepare('SELECT COUNT(*) as total, COALESCE(SUM(guests), 0) as total_guests FROM bookings WHERE date >= ?').bind(weekStart).first(),
      context.env.DB.prepare('SELECT time, COUNT(*) as cnt FROM bookings GROUP BY time ORDER BY cnt DESC LIMIT 1').first(),
      context.env.DB.prepare("SELECT COUNT(*) as total FROM bookings WHERE status = 'cancelled'").first(),
      context.env.DB.prepare("SELECT COUNT(*) as total FROM bookings WHERE table_number != ''").first(),
    ]);

    return new Response(
      JSON.stringify({
        total_bookings: (totalResult as any)?.total || 0,
        total_guests: (totalResult as any)?.total_guests || 0,
        today_bookings: (todayResult as any)?.total || 0,
        today_guests: (todayResult as any)?.total_guests || 0,
        week_bookings: (weekResult as any)?.total || 0,
        week_guests: (weekResult as any)?.total_guests || 0,
        popular_time: (popularTimeResult as any)?.time || '—',
        cancelled_bookings: (cancelledResult as any)?.total || 0,
        tables_assigned: (assignedResult as any)?.total || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] Stats error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
