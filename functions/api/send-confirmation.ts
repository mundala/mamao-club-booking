interface Env {
  RESEND_API_KEY: string;
}

interface BookingPayload {
  name: string;
  phone: string;
  email: string;
  notes: string;
  people: number;
  date: string;
  time: string;
  bookingRef: string;
  cancelToken?: string;
}

const OWNER_EMAIL = 'Thidarat090340@gmail.com';

function buildEmailHtml(booking: BookingPayload): string {
  const unitStr = booking.people < 10 ? `0${booking.people}` : `${booking.people}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAMAO CLUB // CONFIRMATION</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;color:#F5F5F5;font-family:'Courier New',Courier,monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="400" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #333;max-width:400px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding:30px;">
              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #D71921;padding-bottom:15px;margin-bottom:20px;">
                <tr>
                  <td style="font-size:24px;font-weight:bold;letter-spacing:-1px;color:#F5F5F5;">Mamao Club</td>
                  <td align="right"><span style="font-size:10px;color:#D71921;border:1px solid #D71921;padding:2px 6px;letter-spacing:2px;">CONFIRMED</span></td>
                </tr>
              </table>

              <!-- Booking Details -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">REF</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.bookingRef}</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">NAME</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.name || '\u2014'}</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">PHONE</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.phone || '\u2014'}</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">EMAIL</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.email}</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">GUESTS</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${unitStr} SOULS</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">DATE</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.date}</td>
                </tr>
                <tr style="font-size:12px;letter-spacing:1px;">
                  <td style="color:#888;padding:6px 0;">ARRIVAL</td>
                  <td align="right" style="color:#fff;font-weight:bold;padding:6px 0;">${booking.time}</td>
                </tr>
              </table>

              ${booking.notes ? `
              <!-- Notes -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px;padding-top:15px;border-top:1px solid #222;">
                <tr>
                  <td style="font-size:10px;color:#666;letter-spacing:2px;padding-bottom:8px;">SPECIAL REQUESTS</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#aaa;line-height:1.5;">${booking.notes}</td>
                </tr>
              </table>
              ` : ''}

              <!-- Cancellation Link -->
              ${booking.cancelToken ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:20px;border-top:1px solid #222;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <span style="font-size:11px;font-weight:bold;color:#F5F5F5;letter-spacing:2px;">NEED TO CANCEL?</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://book.mamaogang.com/cancel?token=${booking.cancelToken}" style="display:inline-block;padding:14px 32px;background:#D71921;color:#FFFFFF;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;letter-spacing:3px;text-decoration:none;text-transform:uppercase;">CANCEL BOOKING</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <span style="font-size:9px;color:#555;letter-spacing:1px;">One tap to cancel — no login required</span>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
                <tr>
                  <td align="center" style="font-size:9px;color:#444;letter-spacing:2px;text-transform:uppercase;">
                    Mamao Club &bull; Chiang Mai<br>
                    <a href="https://www.instagram.com/mamaoclub.melb/" style="color:#D71921;text-decoration:none;">Instagram</a> &bull;
                    <a href="https://www.facebook.com/61560555782062" style="color:#D71921;text-decoration:none;">Facebook</a>
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const booking: BookingPayload = await context.request.json();

    if (!booking.email || !booking.bookingRef) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const html = buildEmailHtml(booking);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mamao Club <bookings@mamaogang.com>',
        to: [booking.email],
        bcc: [OWNER_EMAIL],
        subject: `Booking Confirmed — ${booking.bookingRef} | Mamao Club`,
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
      JSON.stringify({ success: true, id: (data as { id: string }).id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('send-confirmation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
