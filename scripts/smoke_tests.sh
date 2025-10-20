#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-}

echo "Running smoke tests against $BASE_URL"

echo "1) GET / (home)"
curl -sSf -o /dev/null "$BASE_URL/" && echo "OK"

echo "2) GET /api/csrf-token"
if curl -sSf -H "Accept: application/json" "$BASE_URL/api/csrf-token" | jq . >/dev/null 2>&1; then
  echo "OK"
else
  echo "CSRF token endpoint failed" >&2
  exit 2
fi

echo "3) POST /api/auth/login (invalid creds expected)"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"noone@example.com","password":"badpass"}')
if [ "$HTTP" != "200" ]; then
  echo "OK (login rejected as expected)"
else
  echo "Unexpected 200 from login with invalid creds" >&2
  exit 3
fi

echo "4) Check public assets (logo)"
LOGO_URL="https://res.cloudinary.com/dgqhyz67g/image/upload/Cleaned-logo-Premier-bank_flnsfz.png"
if curl -sSf -o /dev/null "$LOGO_URL"; then
  echo "OK"
else
  echo "Logo asset fetch failed" >&2
  exit 4
fi

echo "Smoke tests completed successfully"
