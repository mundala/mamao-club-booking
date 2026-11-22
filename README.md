# Mamao Club Booking

## What it is
A table-reservation web app I built for a venue I ran. Guests pick a party size and an arrival time (21:00 to 23:00) and get a booking reference. The app attempts to save the booking to a Cloudflare D1 database and send a confirmation email with a cancellation link. Static admin pages let staff view bookings, customers and stats.

## Run it
```bash
npm install
npm run dev          # frontend only
```

Full stack (local D1 plus Pages Functions):
```bash
npm install
npx wrangler d1 migrations apply mamao-bookings --local
npm run build
npx wrangler pages dev dist
```
Put `RESEND_API_KEY` and `ADMIN_PASSWORD` in `.dev.vars` (not covered by `.gitignore`, so do not commit it). Not run end to end since the venue closed, so Wrangler compatibility is unverified.

## Stack
React 18, TypeScript, Vite 5, Tailwind CSS 4, Framer Motion. Cloudflare Pages Functions in `functions/api/`, D1 with SQL migrations in `migrations/`, Resend for email.

## How it works
1. A 4-step wizard in `App.tsx`: party size, date and time, contact details, success.
2. On submit it writes a copy to `localStorage` and posts to `POST /api/bookings`, which inserts a row with a random cancel token.
3. `POST /api/send-confirmation` emails the guest a link to `/cancel`, which loads the booking and posts to `/api/cancel`.
4. `public/admin.html` and `public/floorplan.html` call the endpoints under `functions/api/admin/`, guarded by an `X-Admin-Password` header.

## Limitations
- The guest screen shows success even if the save or the email request fails.
- Booking and email endpoints are public (CORS `*`) and only check a few required fields. No availability check, no rate limiting. Email HTML does not escape guest input.
- The saved date comes from `toISOString()` (UTC), so it can differ from the local date the guest picked.
- Opening a cancel link cancels the booking immediately, so a link scanner could trigger it.
- Admin auth is one shared password in a header, kept in `sessionStorage` by the admin page.
- The 12+ guest deposit step is a UI delay, not a real payment.
- `services/geminiService.ts` (souvenir image generation) exists but nothing calls it. If it were connected, `vite.config.ts` would inject the key into the client bundle, so it would need a server-side proxy first.
- No automated tests found.

## AI assistance
I direct AI coding assistants (Claude Code, Codex, Gemini) and review the output. I am still learning Python and TypeScript, and some of the code above is more than I could have written alone.

## Status
The venue has closed. Kept as a portfolio piece, not maintained.
