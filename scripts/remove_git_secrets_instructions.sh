#!/bin/sh
set -e

cat <<'EOF'
This script does NOT modify your repo. It prints recommended commands to purge secrets from git history.

Steps to purge secrets safely:

1) Use the BFG Repo-Cleaner to remove files or tokens quickly:
   - Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
   - Examples:
     bfg --delete-files .env
     bfg --replace-text replacements.txt

   See: https://rtyley.github.io/bfg-repo-cleaner/#usage

2) Or use git filter-repo (recommended):
   - Install: pip install git-filter-repo
   - Example to remove a string from history:
     git filter-repo --replace-text replacements.txt

   Where replacements.txt contains lines like:
     password123==[REDACTED]
     rootpassword==[REDACTED]

3) After rewriting history, force-push to remote:
   git push --force --all
   git push --force --tags

4) Rotate any keys that may have been exposed (Supabase service role, DB passwords, Sentry DSN)
   - Create new values and update environment providers (Vercel/GH Actions/Secrets manager).

5) Invalidate leaked credentials if supported (e.g., regenerate Supabase service role key).

EOF

exit 0
