This project configures CI build caching in .github/workflows/ci.yml.

Recommendations to speed up local and CI builds:

- Ensure the following paths are cached between runs: .next/cache, .next, node_modules, and yarn cache (~/.cache/yarn).
- For CI on GitHub Actions the workflow caches those paths via actions/cache.
- For local development, consider using a shared cache directory or running builds inside a container that preserves the .next/cache between runs.
- Avoid committing .next or build artifacts; .gitignore is configured accordingly.

If you want, I can add a GitHub Actions badge or extended caching for more granular workspaces.
