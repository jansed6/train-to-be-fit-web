#!/usr/bin/env bash
# Runs the database tests against a throwaway local Postgres cluster, in two
# databases:
#   fresh:    the Supabase stub, then supabase/schema.sql twice (it must be
#             re-runnable), then every supabase/tests/*.test.sql;
#   upgraded: the stub, the schema from before the trainer role (what live
#             projects already have), then supabase/schema.sql and the tests.
# Usage: npm run test:db
#
# Postgres binaries come from $PG_BIN, else from `initdb` on PATH, else from
# Postgres.app. The cluster listens on 127.0.0.1:${PG_TEST_PORT:-54329}.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
schema="$here/../schema.sql"

if [[ -n "${PG_BIN:-}" ]]; then
  bin="$PG_BIN"
elif command -v initdb >/dev/null 2>&1; then
  bin="$(dirname "$(command -v initdb)")"
else
  bin="/Applications/Postgres.app/Contents/Versions/latest/bin"
fi
port="${PG_TEST_PORT:-54329}"

dir="$(mktemp -d)"
cleanup() {
  "$bin/pg_ctl" -D "$dir/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$dir"
}
trap cleanup EXIT

"$bin/initdb" -D "$dir/data" -U postgres -A trust -E UTF8 --no-locale >/dev/null
# TCP only (-k ''): a Unix socket path inside the temp dir would be too long.
"$bin/pg_ctl" -D "$dir/data" -l "$dir/server.log" -w \
  -o "-p $port -k '' -c listen_addresses=127.0.0.1" start >/dev/null

export PGCLIENTENCODING=UTF8
export PGOPTIONS="-c client_min_messages=warning"
# run <database> <file>
run() {
  "$bin/psql" -X -h 127.0.0.1 -p "$port" -U postgres -d "$1" \
    -v ON_ERROR_STOP=1 -q -f "$2"
}
run_tests() {
  for test in "$here"/*.test.sql; do
    echo "${test##*/} ($1)"
    run "$1" "$test"
  done
}

"$bin/psql" -X -h 127.0.0.1 -p "$port" -U postgres -d postgres -q \
  -c "create database fresh" -c "create database upgraded"

run fresh "$here/stub.sql"
run fresh "$schema"
run fresh "$schema"
run_tests fresh

run upgraded "$here/stub.sql"
run upgraded "$here/schema-before-trainer.sql"
run upgraded "$schema"
run_tests upgraded

echo "DB tests passed"
