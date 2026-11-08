#!/usr/bin/env bash
# Create (or update) the local Home Assistant dev instance.
#
#   scripts/dev-setup.sh            # HA version from HA_VERSION below
#   scripts/dev-setup.sh 2026.11.0  # a specific HA version
#
# Creates .venv-dev with Home Assistant and links the integration into dev-config/.
set -euo pipefail

HA_VERSION="${1:-2026.10.4}"
PYTHON_VERSION="3.14"

cd "$(dirname "$0")/.."

UV="$(command -v uv || true)"
if [[ -z "$UV" && -x .venv/bin/uv ]]; then
  UV=.venv/bin/uv
fi
if [[ -z "$UV" ]]; then
  echo "uv not found. Install it with 'brew install uv' (or 'pipx install uv')." >&2
  exit 1
fi

"$UV" python install "$PYTHON_VERSION"
if [[ ! -x .venv-dev/bin/python ]]; then
  "$UV" venv --python "$PYTHON_VERSION" .venv-dev
fi
VIRTUAL_ENV=.venv-dev "$UV" pip install "homeassistant==$HA_VERSION" "pymodbus>=3.10" debugpy

mkdir -p dev-config/custom_components
ln -sfn ../../custom_components/charging_coordinator \
  dev-config/custom_components/charging_coordinator

echo
echo "Home Assistant $HA_VERSION is ready. Start it with scripts/dev-run.sh"
echo "or with the 'Home Assistant (dev)' launch configuration in VS Code."
