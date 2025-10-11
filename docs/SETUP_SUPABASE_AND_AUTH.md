# Supabase & Authentication Setup

This document explains how to configure Supabase, redirect URLs, environment variables, and the resend/rate-limit behavior used by this project.

## Quick overview
- App uses Supabase Auth (magic links + SMS OTP) for client-side sign-in and a backend exchange (/auth/supabase) to mint a JWT and set a secure refresh cookie.
- Resend rate-limits are enforced server-side using Redis (keys: `resend:count:<id>`, `resend:day:<id>`, `resend:last:<id>`).
- Frontend code automatically passes a `redirectTo` URL for magic links and shows a verify UX at `/verify-email`.

## Important environment variables
Set these in production (and locally for development):
- NEXT_PUBLIC_SUPABASE_URL - public Supabase URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - public anon key
- SUPABASE_URL - (server) Supabase URL for admin client
- SUPABASE_SERVICE_ROLE_KEY - (server) Supabase service role key
- NEXT_PUBLIC_SITE_URL - public site URL (must be https:// in production)
- REDIS_URL - Redis connection (used for rate-limits)
- NEXT_PUBLIC_API_URL - backend API base URL (e.g. https://api.your-site)
- JWT_SECRET - backend JWT secret

Do NOT commit secrets to git. Use your host's secret manager / environment settings.

## Supabase project settings (Auth)
1. Go to Supabase Console → Authentication → Settings.
2. Set "Site URL" to your production URL (e.g. https://app.example.com).
3. Add Redirect URLs (exact URLs, no wildcards). Examples:
   - https://app.example.com/verify-email
   - https://app.example.com/dashboard
   - http://localhost:3000/verify-email (for local dev)
   - http://localhost:3000/
4. Configure Email (SMTP) provider under Auth → Templates & SMTP so magic links are delivered.
5. Configure SMS provider (e.g. Twilio) if using phone OTP.

Note: Supabase will only accept `redirectTo` values that match the Redirect URLs above.

## How the code uses redirectTo
- apps/web/lib/supabase.ts: helper functions signInWithEmailOtp and signUpWithEmail were extended to include `redirectTo` (defaults to `${NEXT_PUBLIC_SITE_URL}/verify-email?email=...`).
- apps/web/pages/register.tsx and apps/web/pages/login.tsx pass a redirect target when requesting magic links.
- apps/web/pages/verify-email.tsx handles the UX when a magic link is expected and provides resend/check actions.

If you need a different landing path after magic links, update NEXT_PUBLIC_SITE_URL or change the `redirectTo` argument in the calls above.

## Rate-limits & resend endpoints
- API endpoints (apps/api/src/modules/auth/auth.controller.ts):
  - POST /auth/resend — checks/increments Redis counters and returns `{ ok: true }` or `{ ok: false, message }`.
  - GET /auth/link-status?email=... — returns `{ attemptsToday, lastSent }`.
- Limits implemented:
  - Per-minute: 5 resends
  - Per-day: 50 resends
- Redis keys used:
  - `resend:count:<key>` (TTL 60s)
  - `resend:day:<key>` (TTL 24h)
  - `resend:last:<key>` (timestamp)

## Testing (local)
- Ensure env vars are set locally (e.g. .env or your host). For local tests add `http://localhost:3000` to Supabase Redirect URLs.
- Start dev: `npm run dev` or via the platform dev server control.
- Request a magic link from the login page; it will return a link to the address you configured in Supabase.

Curl examples (replace host):
- Check rate-limit/link status:
  curl "${NEXT_PUBLIC_API_URL:-http://localhost:4000}/auth/link-status?email=you@example.com"
- Request resend (server-side guard will apply):
  curl -X POST "${NEXT_PUBLIC_API_URL:-http://localhost:4000}/auth/resend" -H 'Content-Type: application/json' -d '{"email":"you@example.com"}'

## Production HTTPS requirement
- Use an HTTPS site URL in Supabase and set `NEXT_PUBLIC_SITE_URL` to the exact https:// URL. This ensures magic links use secure redirects and cookies are set with `secure:true`.
- Hosts like Vercel/Fly/Netlify automatically provide TLS for your domain.

## Troubleshooting
- Magic link not working: ensure link's redirect URL exactly matches one of the Redirect URLs in the Supabase dashboard.
- No email received: configure SMTP in Supabase Auth settings and check spam. For SMS enable provider in Supabase.
- Rate-limited resend: check Redis and `link-status` endpoint to see `lastSent` and `attemptsToday`.

## Where to change behavior in code
- Redirect defaults and helpers: `apps/web/lib/supabase.ts`
- Signup/login usage and UX: `apps/web/pages/register.tsx`, `apps/web/pages/login.tsx`, `apps/web/pages/verify-email.tsx`
- API resend/rate-limit: `apps/api/src/modules/auth/auth.controller.ts` and `apps/api/src/common/guards/rate-limit.guard.ts`
- Redis connection: `apps/api/src/redis/redis.service.ts`

---
If you want, I can add this to the README or open a PR with an additional short `AUTH.md` under `apps/api/` — tell me where you'd like the documentation placed or if you'd like a shortened version for the README.
