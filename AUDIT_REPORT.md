Full repo audit - premium-banking-monorepo

## Summary

I scanned the repository for package.json files, ESLint and Next.js configs, TypeScript settings, environment variable usage, and Supabase integrations. Key issues and recommendations are listed below.

## Inventory

- package.json files found:
  - package.json (root)
  - server/package.json
  - apps/web/package.json
- ESLint configs:
  - apps/web/.eslintrc.js (updated to include parser/plugins)
  - eslint.config.js (root)
- Next.js config:
  - apps/web/next.config.js
  - vercel.json points to apps/web/package.json (correct for monorepo)
- Many server scripts and server/ code depend on SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL

## Findings and recommended fixes

1. ESLint: "Failed to load config 'next/core-web-vitals'"
   - Cause: eslint-config-next or supporting parser/plugins missing in the workspace devDependencies.
   - Action taken: added eslint-config-next and TypeScript ESLint parser/plugin entries to apps/web/package.json and updated apps/web/.eslintrc.js to set parser and plugin.
   - Recommendation: commit these changes and ensure CI/Vercel installs workspace devDependencies.

2. Inconsistent lockfiles / Next.js versions
   - The apps/web package.json lists next ^14.2.4; lockfile contains references to Next 13 packages.
   - Risk: mismatched Next/SWC packages can cause install or build-time resolution issues on CI.
   - Recommendation: pick a single Next version, remove sub-folder package-lock.json files (keep root lockfile) and run a clean npm install at repo root to regenerate lockfile.

3. Monorepo workspace warnings in CI
   - Vercel logs showed: "premium-banking-web in filter set, but no workspace folder present" earlier. Ensure Vercel project configuration references correct root and build settings (vercel.json is correct) and that package manager installs workspace dependencies.
   - Recommendation: ensure root package.json lists "workspaces": ["apps/web", ...] (it does), then run npm ci at repo root locally and verify workspace installs correctly.

4. Environment variables / secrets required
   - Multiple server and tests require SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DB_URL, and ENV_CHECK_SECRET.
   - If these are missing in Vercel, runtime scripts and some build-time checks may fail.
   - Recommendation: add required secrets in Vercel dashboard or via MCP connection (Supabase). For Supabase-related work, connect Supabase via MCP.

5. TypeScript / typecheck
   - apps/web has "typecheck": "tsc --noEmit" available. Recommend running tsc -b at repo root to catch type issues.

6. Security headers & CSP
   - next.config.js contains a Content-Security-Policy builder using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_API_URL; verify these env variables are set in production.

7. Tests & utilities
   - server/test and scripts reference Supabase service keys. Running tests in CI will require secrets.

## Actionable next steps (PR-ready)

- Commit the apps/web/package.json and apps/web/.eslintrc.js changes (already applied in workspace).
- Remove apps/web/package-lock.json and server/package-lock.json (if you prefer single root lockfile) and run npm install at repo root to regenerate lockfile.
- Ensure Vercel project environment variables include:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (secret)
  - NEXT_PUBLIC_API_URL
  - ENV_CHECK_SECRET (secret)
  - DB_URL and DB_PASSWORD if server jobs run on deployment
- Run locally: npm ci && npm run typecheck && npm run lint && npm run build from repo root to verify.
- Verify Node engine/versions: ensure Node >= 18 for some dependencies/plugins used.

## MCP integrations (recommended)

When helpful, you can connect these MCP integrations from the UI (Open MCP popover):

- Supabase — for DB, auth, and real-time features. Connect: [Connect to Supabase](#open-mcp-popover)
- Neon — as an alternative Postgres provider. Connect: [Connect to Neon](#open-mcp-popover)
- Netlify — for hosting (if you use Netlify instead of Vercel). Connect: [Connect to Netlify](#open-mcp-popover)
- Zapier — automation and workflows. Connect: [Connect to Zapier](#open-mcp-popover)
- Figma — design to code (use Builder.io Figma plugin). Get plugin via MCP: [Connect to Figma](#open-mcp-popover)
- Builder.io — CMS and content management. Connect: [Connect to Builder.io](#open-mcp-popover)
- Linear — issue tracking and management. Connect: [Connect to Linear](#open-mcp-popover)
- Notion — docs and knowledge base. Connect: [Connect to Notion](#open-mcp-popover)
- Sentry — error monitoring. Connect: [Connect to Sentry](#open-mcp-popover)
- Context7 — docs lookup. Connect: [Connect to Context7](#open-mcp-popover)
- Semgrep — security scanning. Connect: [Connect to Semgrep](#open-mcp-popover)
- Prisma Postgres — for ORM/db management. Connect: [Connect to Prisma](#open-mcp-popover)

## Notes

- I updated ESLint config and workspace package.json in apps/web to fix the immediate Vercel build failure. Push and redeploy to confirm.
- If you want, I can run a deeper scan for unused components and broken imports (this requires running typecheck and possibly static analysis). Do you want me to run full typecheck and produce a file-by-file findings list?
