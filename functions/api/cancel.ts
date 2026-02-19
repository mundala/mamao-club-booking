interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing token' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const row = await context.env.DB.prepare(
      'SELECT ref, name, date, time, guests, status FROM bookings WHERE cancel_token = ?'
    ).bind(token).first();

    if (!row) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ booking: row }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] Cancel lookup error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing token' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const result = await context.env.DB.prepare(
      "UPDATE bookings SET status = 'cancelled', table_number = '' WHERE cancel_token = ? AND status != 'cancelled'"
    ).bind(token).run();

    if (result.meta.changes === 0) {
      // Either token not found or already cancelled — check which
      const row = await context.env.DB.prepare(
        'SELECT status FROM bookings WHERE cancel_token = ?'
      ).bind(token).first();

      if (!row) {
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Already cancelled — idempotent success
      return new Response(
        JSON.stringify({ success: true, alreadyCancelled: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] Cancel error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
