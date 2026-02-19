interface Env {
  DB: D1Database;
}

interface BookingPayload {
  ref: string;
  name?: string;
  phone?: string;
  email?: string;
  guests?: number;
  date: string;
  time: string;
  notes?: string;
  createdAt?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: BookingPayload = await context.request.json();

    if (!body.ref || !body.date || !body.time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ref, date, time' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const cancelToken = crypto.randomUUID();

    await context.env.DB.prepare(
      `INSERT INTO bookings (ref, name, phone, email, guests, date, time, notes, created_at, cancel_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.ref,
        body.name || '',
        body.phone || '',
        body.email || '',
        body.guests || 1,
        body.date,
        body.time,
        body.notes || '',
        body.createdAt || new Date().toISOString(),
        cancelToken
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, ref: body.ref, cancelToken }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'Duplicate booking ref' }),
        { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    console.error('[D1] Save booking error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
