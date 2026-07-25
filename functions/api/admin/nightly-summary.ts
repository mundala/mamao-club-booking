interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  RESEND_API_KEY: string;
}

const OWNER_EMAIL = 'Thidarat.mmc@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

/** Get YYYY-MM-DD in Melbourne time (AEST/AEDT) */
function melbourneDate(offset = 0): string {
  const now = new Date();
  const melb = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
  melb.setDate(melb.getDate() + offset);
  const y = melb.getFullYear();
  const m = String(melb.getMonth() + 1).padStart(2, '0');
  const d = String(melb.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format YYYY-MM-DD to "Mon 3 Mar" */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[dt.getDay()]} ${d} ${months[dt.getMonth()]}`;
}

interface Booking {
  ref: string;
  name: string;
  phone: string;
  email: string;
  guests: number;
  date: string;
  time: string;
  notes: string;
  status: string;
  table_number: string;
}

function buildSummaryHtml(
  todayDate: string,
  tonightBookings: Booking[],
  upcoming: { date: string; bookings: Booking[] }[]
): string {
  const totalGuests = tonightBookings.reduce((sum, b) => sum + b.guests, 0);
  const assigned = tonightBookings.filter(b => b.table_number).length;

  // Tonight's booking rows
  const tonightRows = tonightBookings.length > 0
    ? tonightBookings.map(b => `
                <tr style="font-size:12px;letter-spacing:0.5px;">
                  <td style="color:#D71921;padding:8px 0;font-weight:bold;width:55px;">${b.time}</td>
                  <td style="color:#fff;padding:8px 4px;font-weight:bold;">${b.name || '—'}</td>
                  <td align="center" style="color:#aaa;padding:8px 4px;width:60px;">${b.guests} pax</td>
                  <td align="right" style="color:${b.table_number ? '#4ade80' : '#666'};padding:8px 0;width:60px;font-size:11px;">${b.table_number ? 'T' + b.table_number : '—'}</td>
                </tr>`).join('')
    : `<tr><td colspan="4" style="color:#666;font-size:12px;padding:16px 0;text-align:center;letter-spacing:2px;">NO BOOKINGS TONIGHT</td></tr>`;

  // Upcoming days
  const upcomingRows = upcoming.map(day => {
    const closed = isClosedDay(day.date);
    const dayGuests = day.bookings.reduce((sum, b) => sum + b.guests, 0);
    const count = day.bookings.length;
    return `
                <tr style="font-size:12px;">
                  <td style="color:${closed ? '#555' : '#fff'};padding:6px 0;font-weight:bold;">${formatDate(day.date)}${closed ? ' <span style="font-size:9px;color:#D71921;">CLOSED</span>' : ''}</td>
                  <td align="right" style="color:${closed ? '#555' : count > 0 ? '#D71921' : '#666'};padding:6px 0;">
                    ${closed ? '—' : count > 0 ? `${count} booking${count > 1 ? 's' : ''}, ${dayGuests} guests` : 'No bookings'}
                  </td>
                </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAMAO CLUB // NIGHTLY BRIEFING</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;color:#F5F5F5;font-family:'Courier New',Courier,monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #333;max-width:480px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding:30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #D71921;padding-bottom:15px;margin-bottom:20px;">
                <tr>
                  <td style="font-size:24px;font-weight:bold;letter-spacing:-1px;color:#F5F5F5;">Mamao Club</td>
                  <td align="right"><span style="font-size:10px;color:#D71921;border:1px solid #D71921;padding:2px 6px;letter-spacing:2px;">BRIEFING</span></td>
                </tr>
              </table>

              <!-- Date -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;">TONIGHT'S BRIEFING</td>
                  <td align="right" style="font-size:11px;color:#888;letter-spacing:1px;">${formatDate(todayDate)}</td>
                </tr>
              </table>

              <!-- Stats Bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111;margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:12px 0;border-right:1px solid #222;">
                    <div style="font-size:22px;font-weight:bold;color:#D71921;">${tonightBookings.length}</div>
                    <div style="font-size:9px;color:#666;letter-spacing:2px;margin-top:2px;">BOOKINGS</div>
                  </td>
                  <td align="center" style="padding:12px 0;border-right:1px solid #222;">
                    <div style="font-size:22px;font-weight:bold;color:#fff;">${totalGuests}</div>
                    <div style="font-size:9px;color:#666;letter-spacing:2px;margin-top:2px;">GUESTS</div>
                  </td>
                  <td align="center" style="padding:12px 0;">
                    <div style="font-size:22px;font-weight:bold;color:${assigned === tonightBookings.length && tonightBookings.length > 0 ? '#4ade80' : '#facc15'};">${assigned}/${tonightBookings.length}</div>
                    <div style="font-size:9px;color:#666;letter-spacing:2px;margin-top:2px;">TABLES</div>
                  </td>
                </tr>
              </table>

              <!-- Tonight's Bookings -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td colspan="4" style="font-size:10px;color:#666;letter-spacing:2px;padding-bottom:8px;border-bottom:1px solid #222;">TONIGHT</td>
                </tr>
                ${tonightRows}
              </table>

              <!-- Upcoming -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:16px;border-top:1px solid #222;">
                <tr>
                  <td colspan="2" style="font-size:10px;color:#666;letter-spacing:2px;padding-bottom:8px;">UPCOMING</td>
                </tr>
                ${upcomingRows}
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;padding-top:16px;border-top:1px solid #222;">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <a href="https://book.mamaogang.com/admin" style="display:inline-block;padding:10px 24px;background:#D71921;color:#FFFFFF;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:bold;letter-spacing:3px;text-decoration:none;">OPEN DASHBOARD</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:9px;color:#444;letter-spacing:2px;text-transform:uppercase;">
                    Mamao Club &bull; Melbourne
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Check if a YYYY-MM-DD date falls on a closed day (Wednesday=3, Sunday=0) */
function isClosedDay(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 3; // Sunday or Wednesday
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const password = context.request.headers.get('X-Admin-Password');
  if (!password || password !== context.env.ADMIN_PASSWORD) {
    return unauthorized();
  }

  try {
    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Allow manual date override via ?date=YYYY-MM-DD
    const url = new URL(context.request.url);
    const todayDate = url.searchParams.get('date') || melbourneDate(0);
    const force = url.searchParams.get('force') === 'true';

    // Skip on closed days (Wed/Sun) unless forced or manual date
    if (!force && !url.searchParams.get('date') && isClosedDay(todayDate)) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Closed day (Wed/Sun)', date: todayDate }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Query tonight's bookings
    const tonightResult = await context.env.DB.prepare(
      `SELECT * FROM bookings WHERE date = ? AND status = 'confirmed' ORDER BY time ASC`
    ).bind(todayDate).all();
    const tonightBookings = (tonightResult.results || []) as unknown as Booking[];

    // Query upcoming 3 days
    const upcoming: { date: string; bookings: Booking[] }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = url.searchParams.get('date')
        ? (() => { const dt = new Date(todayDate + 'T00:00:00'); dt.setDate(dt.getDate() + i); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; })()
        : melbourneDate(i);
      const result = await context.env.DB.prepare(
        `SELECT * FROM bookings WHERE date = ? AND status = 'confirmed' ORDER BY time ASC`
      ).bind(d).all();
      upcoming.push({ date: d, bookings: (result.results || []) as unknown as Booking[] });
    }

    const html = buildSummaryHtml(todayDate, tonightBookings, upcoming);

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mamao Club <bookings@mamaogang.com>',
        to: [OWNER_EMAIL],
        subject: `Tonight's Briefing — ${formatDate(todayDate)} | ${tonightBookings.length} bookings`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend API error:', res.status, errBody);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', detail: errBody }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({
        success: true,
        id: (data as { id: string }).id,
        date: todayDate,
        bookings: tonightBookings.length,
        guests: tonightBookings.reduce((sum, b) => sum + b.guests, 0),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[NIGHTLY] Summary email error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};
