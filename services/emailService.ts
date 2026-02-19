export const generateBookingConfirmation = (
  bookingDetails: {
    name: string;
    phone: string;
    email: string;
    notes: string;
    people: number;
    range: { start: Date; end: Date };
    souvenirUrl?: string;
    bookingRef: string;
  }
): string => {
  const startStr = bookingDetails.range.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const endStr = bookingDetails.range.end.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = bookingDetails.range.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const dateDisplay = startStr === endStr ? startStr : `${startStr} to ${endStr}`;
  const unitStr = bookingDetails.people < 10 ? `0${bookingDetails.people}` : `${bookingDetails.people}`;

  const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MAMAO CLUB // CONFIRMATION</title>
    <style>
        body {
            background-color: #050505;
            color: #F5F5F5;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .ticket {
            background: #0a0a0a;
            border: 1px solid #333;
            max-width: 400px;
            width: 100%;
            padding: 30px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            position: relative;
            overflow: hidden;
        }
        .header {
            border-bottom: 2px solid #D71921;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: -1px;
        }
        .status {
            font-size: 10px;
            color: #D71921;
            border: 1px solid #D71921;
            padding: 2px 6px;
            letter-spacing: 2px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 12px;
            letter-spacing: 1px;
            color: #888;
        }
        .val {
            color: #fff;
            font-weight: bold;
        }
        .notes-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #222;
        }
        .notes-label {
            font-size: 10px;
            color: #666;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        .notes-text {
            font-size: 12px;
            color: #aaa;
            line-height: 1.5;
            white-space: pre-wrap;
        }
        .souvenir {
            margin-top: 30px;
            border: 1px solid #222;
            padding: 5px;
            background: #000;
        }
        img {
            width: 100%;
            display: block;
            opacity: 0.9;
            filter: contrast(1.1) grayscale(0.2);
        }
        .footer {
            margin-top: 30px;
            font-size: 9px;
            color: #444;
            text-align: center;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .scan-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: rgba(215, 25, 33, 0.2);
            animation: scan 4s linear infinite;
            pointer-events: none;
        }
        @keyframes scan {
            0% { top: -10%; }
            100% { top: 110%; }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="scan-line"></div>
        <div class="header">
            <div class="brand">Mamao Club</div>
            <div class="status">CONFIRMED</div>
        </div>

        <div class="row">
            <span>REF</span>
            <span class="val">${bookingDetails.bookingRef}</span>
        </div>
        <div class="row">
            <span>NAME</span>
            <span class="val">${bookingDetails.name || '—'}</span>
        </div>
        <div class="row">
            <span>PHONE</span>
            <span class="val">${bookingDetails.phone || '—'}</span>
        </div>
        <div class="row">
            <span>EMAIL</span>
            <span class="val">${bookingDetails.email}</span>
        </div>
        <div class="row">
            <span>UNITS</span>
            <span class="val">${unitStr} HUMANS</span>
        </div>
        <div class="row">
            <span>DATE</span>
            <span class="val">${dateDisplay}</span>
        </div>
        <div class="row">
            <span>ARRIVAL</span>
            <span class="val">${timeStr}</span>
        </div>
        <div class="row">
            <span>SECTOR</span>
            <span class="val">07 // NEO-TOKYO</span>
        </div>

        ${bookingDetails.notes ? `
        <div class="notes-section">
            <div class="notes-label">SPECIAL REQUESTS</div>
            <div class="notes-text">${bookingDetails.notes}</div>
        </div>
        ` : ''}

        <div class="souvenir">
            ${bookingDetails.souvenirUrl
                ? `<img src="${bookingDetails.souvenirUrl}" alt="Digital Artifact" />`
                : '<div style="padding:20px;text-align:center;color:#333;">MAMAO CLUB // YOUR NIGHT AWAITS</div>'
            }
        </div>

        <div class="footer">
            Entry Code: "WABI-SABI" // ID: ${bookingDetails.bookingRef}
        </div>
    </div>
</body>
</html>
  `;

  const blob = new Blob([emailContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  console.log(`%c[SYS.MAIL] CONFIRMATION ARTIFACT GENERATED`, 'color: #D71921; font-weight: bold; letter-spacing: 1px;');

  return url;
};
