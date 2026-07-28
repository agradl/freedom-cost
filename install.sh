#!/usr/bin/env bash
set -euo pipefail

# --- Configuration ---
SERVICE_NAME="webapp"
DESCRIPTION="GitHub Web Application"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_USER="$(whoami)"
SYSTEMD_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

# --- Detect Executable Paths ---
NPM_PATH="$(which npm || true)"
NODE_DIR="$(dirname "${NPM_PATH}")"

if [ -z "${NPM_PATH}" ]; then
  echo "Error: npm is not installed or not in your PATH." >&2
  exit 1
fi

EXEC_START="${NPM_PATH} run dev --port 8081"

echo "==> Application directory: ${APP_DIR}"
echo "==> Using npm executable:  ${NPM_PATH}"

# --- Install Dependencies ---
if [ -f "${APP_DIR}/package.json" ]; then
  echo "==> Installing/updating npm dependencies..."
  npm install --prefix "${APP_DIR}"
fi

# --- Create or Update Systemd Service ---
echo "==> Writing systemd unit file to ${SYSTEMD_PATH}..."

sudo bash -c "cat <<EOF > ${SYSTEMD_PATH}
[Unit]
Description=${DESCRIPTION}
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${EXEC_START}
Restart=always
RestartSec=5
Environment=PATH=${NODE_DIR}:/usr/local/bin:/usr/bin:/bin:\$PATH
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF"

# --- Reload & Restart Service ---
echo "==> Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "==> Enabling and restarting ${SERVICE_NAME}.service..."
sudo systemctl enable "${SERVICE_NAME}.service"
sudo systemctl restart "${SERVICE_NAME}.service"

echo "==> Status check:"
sudo systemctl status "${SERVICE_NAME}.service" --no-pager