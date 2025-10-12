# dashboard# dashboard
[![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)

built

> Replace <OWNER>/<REPO> with your GitHub repository owner/name to enable the badge.

## CI notes
- Workflow caches node_modules per workspace using a key that includes the workspace name for more granular cache hits.
- The workflow sets NEXT_PUBLIC_API_URL to http://localhost:5000 during build to avoid network-dependent prerender failures; replace with your API URL or set repository secrets for production builds.
