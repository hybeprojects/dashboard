Deployment checklist for apps/api

1. Provide server-only environment variables (use secret manager or CI/CD secrets):
   - JWT_SECRET (required): a cryptographically strong secret used to sign JWTs.
   - SUPABASE_URL (required): your Supabase project URL.
   - SUPABASE_SERVICE_ROLE_KEY (required): Supabase service role key for server operations.
   - DATABASE*URL or POSTGRES*\*: PostgreSQL connection string or individual host/user/password vars.
   - REDIS_URL (required): Redis connection for rate-limiting and resend counters.
   - PORT (optional): port to listen on (default 4000).
   - SENTRY_DSN (optional): Sentry DSN for error monitoring.

2. Safety reminders:
   - Do NOT place secrets in client-side envs prefixed with NEXT*PUBLIC*.
   - Rotate SUPABASE_SERVICE_ROLE_KEY and JWT_SECRET if ever exposed.

3. Docker / docker-compose:
   - docker-compose.yml references apps/api and uses apps/api/.env.example as an env_file placeholder.
   - In production, prefer platform-managed secrets rather than env files on disk.

4. CSRF / cookies:
   - The API uses cookie-based CSRF protection for cookie-authenticated flows. If you use bearer token auth (Authorization: Bearer), CSRF can be ignored. Ensure your frontend includes Authorization headers for API calls.

5. Starting locally:
   - Create a local .env with the required vars (copy apps/api/.env.example -> apps/api/.env and fill values).
   - Run the API: from repo root: npm run build -w apps/api && npm --prefix apps/api run start

6. CI / Deploy pipelines:
   - Ensure build runners inject the required server-only secrets into environment.
   - Do not expose JWT_SECRET or Supabase service role to public logs.

7. Rollback & Secrets:
   - Maintain a rotation plan for JWT_SECRET and SUPABASE_SERVICE_ROLE_KEY. Invalidating these will require rotating any long-lived tokens and re-issuing service keys.

If you'd like, I can open a PR that:

- Removes any legacy server references from docs or CI files (I checked docker-compose and there were no references left),
- Adds a small github-actions workflow template for deploying apps/api with secrets.
