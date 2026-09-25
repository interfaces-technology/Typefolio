#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:43123}"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COOKIE_JAR="$(mktemp)"
TEST_EMAIL="typefolio-test-$(date +%s)@example.com"
TEST_PASS="TypefolioTest123!"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "== Typefolio API smoke test =="
echo "Base URL: $BASE_URL"
echo

PREFLIGHT_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/billing/plans" 2>/dev/null || echo 000)"
if [[ "$PREFLIGHT_STATUS" == "000" ]]; then
  echo "ERROR: Cannot reach $BASE_URL — start the app with: npm run dev"
  exit 1
fi

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  if ! (cd "$ROOT_DIR" && npm run check:env >/dev/null 2>&1); then
    echo "ERROR: npm run check:env failed — set BETTER_AUTH_SECRET and other vars in .env.local"
    exit 1
  fi
fi

echo "1. Sign up (Better Auth)"
SIGNUP_BODY="$(mktemp)"
SIGNUP_STATUS="$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -o "$SIGNUP_BODY" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"name\":\"Smoke Test\"}")"
if [[ "$SIGNUP_STATUS" != "200" ]] && [[ "$SIGNUP_STATUS" != "201" ]]; then
  echo "  ERROR: sign-up HTTP $SIGNUP_STATUS"
  head -c 500 "$SIGNUP_BODY" | sed 's/^/  /'
  rm -f "$SIGNUP_BODY"
  exit 1
fi
python3 -c "import json,sys; d=json.load(open('$SIGNUP_BODY')); u=d.get('user') or {}; print('  user:', u.get('email','?'))"
rm -f "$SIGNUP_BODY"

echo "2. Mark email verified (local DB; requires .env.local DATABASE_URL)"
if [[ -f "$ROOT_DIR/.env.local" ]]; then
  (cd "$ROOT_DIR" && npx dotenv-cli -e .env.local -- npx tsx scripts/mark-email-verified.ts "$TEST_EMAIL")
else
  echo "  SKIP: no .env.local — cannot auto-verify test user"
fi

echo "3. Sign in"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}" \
  > /dev/null

SESSION_TOKEN="$(awk '$0 ~ /session_token/ {print $NF}' "$COOKIE_JAR" | tail -1)"
if [[ -z "$SESSION_TOKEN" ]]; then
  echo "  ERROR: missing better-auth session token cookie"
  exit 1
fi
echo "  session token captured (${#SESSION_TOKEN} chars)"

echo "4. GET /api/me (Bearer)"
ME_JSON="$(curl -s -H "Authorization: Bearer $SESSION_TOKEN" "$BASE_URL/api/me")"
echo "  $ME_JSON"
LIBRARY_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['library']['id'])" <<< "$ME_JSON")"
echo "  library: $LIBRARY_ID"

echo "5. GET manifest (free tier → sync gated)"
MANIFEST_STATUS="$(curl -s -o /tmp/typefolio-manifest.json -w '%{http_code}' \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$BASE_URL/api/libraries/$LIBRARY_ID/manifest")"
if [[ "$MANIFEST_STATUS" != "403" ]]; then
  echo "  ERROR: expected 403 for free sync, got $MANIFEST_STATUS"
  cat /tmp/typefolio-manifest.json
  exit 1
fi
echo "  status 403 (SYNC_NOT_AVAILABLE) — OK"

echo "6. Register device"
DEVICE_JSON="$(curl -s -X POST \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test-Mac","platform":"macos"}' \
  "$BASE_URL/api/libraries/$LIBRARY_ID/devices")"
DEVICE_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['device']['id'])" <<< "$DEVICE_JSON")"
echo "  device: $DEVICE_ID"

echo "7. DELETE device (fontsToRemove contract)"
DELETE_DEVICE="$(curl -s -X DELETE \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$BASE_URL/api/libraries/$LIBRARY_ID/devices/$DEVICE_ID")"
python3 -c "import json,sys; d=json.load(sys.stdin); assert d.get('removed') is True; assert 'fontsToRemove' in d" <<< "$DELETE_DEVICE"
echo "  $DELETE_DEVICE"

echo "8. Zip download disabled"
ZIP_STATUS="$(curl -s -o /tmp/typefolio-zip.json -w '%{http_code}' \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$BASE_URL/api/libraries/$LIBRARY_ID/download")"
if [[ "$ZIP_STATUS" != "410" ]]; then
  echo "  ERROR: expected 410 ZIP_DISABLED, got $ZIP_STATUS"
  exit 1
fi
echo "  status 410 — OK"

echo "9. Unauthorized /api/me should fail"
STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/me")"
if [[ "$STATUS" != "401" ]]; then
  echo "  ERROR: expected 401, got $STATUS"
  exit 1
fi
echo "  status 401 — OK"

echo
echo "All API checks passed."
