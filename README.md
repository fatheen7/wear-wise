# WearWise

Weather tells you what's happening. This app tells you what to wear.

A mobile-first, installable PWA built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Zustand.

## Stack

- **Framework:** Next.js 14.2.35 (App Router, TypeScript)
- **Styling:** Tailwind CSS with a custom design token system (light/dark)
- **State:** Zustand, persisted to `localStorage` per device
- **Weather:** [Open-Meteo](https://open-meteo.com) — free, no API key required
- **Assistant / wardrobe photo recognition:** rule-based by default; upgrades automatically to Claude if `ANTHROPIC_API_KEY` is set
- **PWA:** manifest, generated icons, service worker with offline fallback

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it will redirect to onboarding on first run.

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is optional:

| Variable | Required? | What it does without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Assistant and wardrobe photo recognition run on the built-in deterministic engine instead of Claude. Nothing is faked — you just get rule-based answers instead of AI-generated ones. |
| `WEATHER_API_KEY` | No | Not used by default — weather comes from Open-Meteo, which needs no key. Only add this if you swap the provider in `app/api/weather/route.ts`. |

No secrets are ever sent to the client — all provider calls happen in `app/api/*/route.ts` server routes.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: Next.js (auto-detected). No build settings need changing.
4. (Optional) Add `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables if you want AI-powered assistant replies and photo recognition.
5. Deploy.

Or via CLI:
```bash
npm i -g vercel
vercel
vercel --prod
```

## Installing on your phone (PWA)

Once deployed:
- **iPhone (Safari):** open the URL → Share → Add to Home Screen.
- **Android (Chrome):** open the URL → ⋮ menu → Add to Home Screen / Install app.

It will open in standalone mode (no browser chrome), with a real app icon and splash behavior.

## Architecture notes

- `lib/weatherService.ts` — the only thing the UI talks to for weather. Swap providers by editing `app/api/weather/route.ts`; the return shape (`WeatherSnapshot`) is the contract.
- `lib/recommendationEngine.ts` — deterministic, explainable scoring (color harmony, formality fit, weather comfort, recency/preference penalties). No AI in the core loop, by design — keeps it fast, free, and consistent.
- `lib/assistantEngine.ts` + `app/api/assistant/route.ts` — rule-based fallback that the AI-powered path is instructed to stay consistent with.
- `lib/store.ts` — single Zustand store, persisted to `localStorage`. No backend database yet; see "What's not built" below.

## What's not built (be aware before treating this as launch-ready)

- **No multi-device sync or real authentication.** Data lives in the browser's `localStorage` on one device. Add a backend (e.g. Supabase/Postgres + NextAuth) before this matters for real users.
- **No real payment processing.** The paywall screen is a working UI with a local toggle — wire it to Stripe/Razorpay/RevenueCat before charging anyone.
- **Push notifications are not wired up** — the settings toggle exists, but there's no push service configured. Needs a service (e.g. web-push + a cron trigger) added.
- **Wardrobe photos are stored as base64 in `localStorage`**, which is fine for a handful of items but will hit browser storage limits with a large wardrobe. Move to object storage (S3/R2/Cloudinary) if photos become central.
