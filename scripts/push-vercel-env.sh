#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROD_URL="${PROD_URL:-https://restaurant-digital-platform-beige.vercel.app}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-wovdsdjhjuyptrgqoceg}"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

KEYS_FILE="$(mktemp)"
trap 'rm -f "$KEYS_FILE"' EXIT

supabase projects api-keys --project-ref "$PROJECT_REF" -o json > "$KEYS_FILE"

ANON_KEY="$(python3 - <<'PY' "$KEYS_FILE"
import json, sys
data = json.load(open(sys.argv[1]))
print(next(item["api_key"] for item in data if item.get("name") == "anon"))
PY
)"

SERVICE_KEY="$(python3 - <<'PY' "$KEYS_FILE"
import json, sys
data = json.load(open(sys.argv[1]))
print(next(item["api_key"] for item in data if item.get("name") == "service_role"))
PY
)"

ACCESS_SECRET="$(openssl rand -base64 32)"
CRON_SECRET="$(openssl rand -base64 32)"

add_env() {
  local name="$1"
  local value="$2"
  local type="${3:-config}"
  for env in production preview development; do
    printf '%s' "$value" | npx --yes vercel@59.10.0 env add "$name" "$env" --type "$type" --yes --force >/dev/null 2>&1 || {
      echo "Failed to set $name ($env)" >&2
      return 1
    }
    echo "Set $name ($env)"
  done
}

add_env NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" config
add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY" config
add_env SUPABASE_SERVICE_ROLE_KEY "$SERVICE_KEY" secret
add_env NEXT_PUBLIC_SITE_URL "$PROD_URL" config
add_env ACCESS_TOKEN_SECRET "$ACCESS_SECRET" secret
add_env CRON_SECRET "$CRON_SECRET" secret
add_env PAYMENT_PROVIDER "demo" config
add_env PAYMENT_DEMO_WEBHOOK_SECRET "demo-webhook-secret-change-me" secret
add_env NOTIFICATION_PROVIDER "demo" config
add_env INTELLIGENCE_PROVIDER "demo" config

echo "Vercel environment variables configured."
