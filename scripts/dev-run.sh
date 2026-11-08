#!/usr/bin/env bash
# Run the local Home Assistant dev instance on http://localhost:8123.
#
# A restart from the HA UI makes Home Assistant exit with code 100 and expects
# a supervisor to start it again (as HA OS does), so this script loops on it.
set -uo pipefail

RESTART_EXIT_CODE=100

cd "$(dirname "$0")/.."

if [[ ! -x .venv-dev/bin/python ]]; then
  echo "Dev instance not set up yet. Run scripts/dev-setup.sh first." >&2
  exit 1
fi

while true; do
  .venv-dev/bin/python -m homeassistant --config dev-config "$@"
  code=$?
  if [[ $code -ne $RESTART_EXIT_CODE ]]; then
    exit $code
  fi
  echo "Restart requested, starting Home Assistant again..."
done
