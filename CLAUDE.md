# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mamao Club Booking Application — a Zen-Tech styled booking interface for a nightclub/venue. Built as a client-side SPA with React + Vite + TypeScript. Uses Google Gemini AI to generate souvenir images for bookings. Designed for local network deployment (Raspberry Pi).

## Commands

```bash
npm run dev       # Dev server on port 3000 (all interfaces)
npm run build     # TypeScript compile + Vite production build
npm run preview   # Preview production build
npm run start     # Production preview on 0.0.0.0:3000
```

No test runner or linter is configured.

## Architecture

**Single-page wizard flow** with 4 steps defined in `types.ts` as `BookingStep`:
1. **PEOPLE** — party size selection (groups ≥12 trigger deposit flow)
2. **DATE** — date/time picker (valid hours: 21:00–23:00)
3. **CONFIRMATION** — email entry + confirmation modal
4. **SUCCESS** — AI souvenir generation + downloadable HTML "confirmation email"

**Key files:**
- `App.tsx` — main orchestrator, all wizard state and step logic (~500 lines)
- `types.ts` — `BookingStep` enum and `BookingState` interface
- `components/DotMatrixCalendar.tsx` — date/time selection component
- `services/geminiService.ts` — Gemini AI image generation (`gemini-3-pro-image-preview`)
- `services/emailService.ts` — generates downloadable HTML file (no actual email sending)

**No backend, database, or authentication.** All state is ephemeral React `useState`. Bookings are not persisted.

## Environment Variables

Set `GEMINI_API_KEY` in `.env.local`. Vite injects it at build time as `process.env.API_KEY` via `vite.config.ts` `define`.

## Styling

TailwindCSS loaded via CDN in `index.html` (not an npm dependency). Custom design system:
- Fonts: Inter, JetBrains Mono, Kaisei Decol
- Colors: off-black `#030303`, warm-white `#F0F0E8`, accent red `#D71921`
- Effects: glassmorphism (backdrop-blur), film grain (SVG noise filter), dot-matrix background
- Animations: Framer Motion for page transitions, haptic feedback via Navigator vibration API
