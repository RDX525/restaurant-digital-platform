#!/usr/bin/env bash
set -euo pipefail

PROD_URL="${PROD_URL:-https://restaurant-digital-platform-beige.vercel.app}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-wovdsdjhjuyptrgqoceg}"

REDIRECTS=(
  "${PROD_URL}/auth/callback"
  "${PROD_URL}/auth/reset-password"
  "${PROD_URL}/auth/accept-invite"
  "http://localhost:3000/auth/callback"
  "http://localhost:3000/auth/reset-password"
  "http://localhost:3000/auth/accept-invite"
)

URI_ALLOW_LIST="$(IFS=,; echo "${REDIRECTS[*]}")"

# Uses Supabase CLI credentials (supabase login).
supabase projects update "$PROJECT_REF" \
  --site-url "$PROD_URL" \
  --uri-allow-list "$URI_ALLOW_LIST" \
  --yes 2>&1 || {
  echo "Supabase auth URL update via CLI failed; configure manually in dashboard." >&2
  exit 1
}

echo "Supabase auth URLs configured for $PROD_URL"
