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
    const url = new URL(context.request.url);
    const statusFilter = url.searchParams.get('status');

    let query = 'SELECT * FROM bookings';
    const binds: string[] = [];

    if (statusFilter === 'confirmed' || statusFilter === 'cancelled') {
      query += ' WHERE status = ?';
      binds.push(statusFilter);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = binds.length > 0
      ? context.env.DB.prepare(query).bind(...binds)
      : context.env.DB.prepare(query);

    const { results } = await stmt.all();

    return new Response(
      JSON.stringify({ bookings: results }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] List bookings error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
