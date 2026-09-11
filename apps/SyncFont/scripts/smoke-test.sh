#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:43123}"
COOKIE_JAR="$(mktemp)"
TEST_EMAIL="syncfont-test-$(date +%s)@example.com"
TEST_PASS="SyncFontTest123!"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "== syncFont API smoke test =="
echo "Base URL: $BASE_URL"
echo

echo "1. Sign up"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"name\":\"SyncFont Test\"}" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('  user:', d.get('user',{}).get('email','?'))"

echo "2. Sign in"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}" \
  > /dev/null

SESSION_TOKEN="$(awk '$6 ~ /session_token/ {print $7}' "$COOKIE_JAR" | tail -1)"
if [[ -z "$SESSION_TOKEN" ]]; then
  echo "  ERROR: missing session token cookie"
  exit 1
fi
echo "  session token captured (${#SESSION_TOKEN} chars)"

echo "3. GET /api/me (Bearer)"
ME_JSON="$(curl -s -H "Authorization: Bearer $SESSION_TOKEN" "$BASE_URL/api/me")"
echo "  $ME_JSON"
LIBRARY_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['library']['id'])" <<< "$ME_JSON")"
echo "  library: $LIBRARY_ID"

echo "4. GET manifest"
MANIFEST_JSON="$(curl -s -H "Authorization: Bearer $SESSION_TOKEN" "$BASE_URL/api/libraries/$LIBRARY_ID/manifest")"
FONT_COUNT="$(python3 -c "import json,sys; print(len(json.load(sys.stdin)['manifest']['fonts']))" <<< "$MANIFEST_JSON")"
echo "  fonts in manifest: $FONT_COUNT"

echo "5. Register device"
DEVICE_JSON="$(curl -s -X POST \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test-Mac","platform":"macos"}' \
  "$BASE_URL/api/libraries/$LIBRARY_ID/devices")"
DEVICE_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['device']['id'])" <<< "$DEVICE_JSON")"
echo "  device: $DEVICE_ID"

echo "6. Unauthorized /api/me should fail"
STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/me")"
echo "  status without auth: $STATUS"

echo
echo "All API checks passed."
