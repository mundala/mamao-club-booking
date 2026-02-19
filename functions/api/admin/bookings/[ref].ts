interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const password = context.request.headers.get('X-Admin-Password');
  if (!password || password !== context.env.ADMIN_PASSWORD) {
    return unauthorized();
  }

  const ref = (context.params as { ref: string }).ref;
  if (!ref) {
    return new Response(
      JSON.stringify({ error: 'Missing booking ref' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await context.request.json() as Record<string, unknown>;
    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof body.table_number === 'string') {
      updates.push('table_number = ?');
      values.push(body.table_number);
    }

    if (body.status === 'confirmed' || body.status === 'cancelled') {
      updates.push('status = ?');
      values.push(body.status);
      // Clear table assignment on cancellation
      if (body.status === 'cancelled' && typeof body.table_number !== 'string') {
        updates.push("table_number = ''");
      }
    }

    // Editable booking fields
    const stringFields = ['name', 'email', 'phone', 'date', 'time', 'notes'] as const;
    for (const field of stringFields) {
      if (typeof body[field] === 'string') {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (typeof body.guests === 'number' && body.guests > 0) {
      updates.push('guests = ?');
      values.push(body.guests);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    values.push(ref);

    const result = await context.env.DB.prepare(
      `UPDATE bookings SET ${updates.join(', ')} WHERE ref = ?`
    ).bind(...values).run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[D1] Update booking error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
