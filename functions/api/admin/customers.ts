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
    const { results } = await context.env.DB.prepare(`
      SELECT
        email,
        MAX(name) as name,
        MAX(phone) as phone,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        COALESCE(SUM(guests), 0) as total_guests,
        MAX(date) as last_visit
      FROM bookings
      WHERE email != ''
      GROUP BY email
      ORDER BY last_visit DESC
    `).all();

    return new Response(
      JSON.stringify({ customers: results }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] Customers error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
