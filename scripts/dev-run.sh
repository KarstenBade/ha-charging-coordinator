#!/usr/bin/env bash
# Run the local Home Assistant dev instance on http://localhost:8123.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -x .venv-dev/bin/python ]]; then
  echo "Dev instance not set up yet. Run scripts/dev-setup.sh first." >&2
  exit 1
fi

exec .venv-dev/bin/python -m homeassistant --config dev-config "$@"
