#!/usr/bin/env bash
# Contypio CMS — One-Command Installer
#
# Usage:
#   curl -fsSL https://get.contypio.com | bash
#   curl -fsSL https://get.contypio.com | bash -s -- --name my-cms --port 3001
#   bash install.sh --name my-cms --domain cms.example.com
#
set -euo pipefail

REPO_URL="https://github.com/contypio/contypio.git"
INSTALL_DIR="contypio"
INSTANCE_NAME=""
CUSTOM_PORT=""
CUSTOM_DOMAIN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --name)    INSTANCE_NAME="$2"; shift 2 ;;
        --port)    CUSTOM_PORT="$2"; shift 2 ;;
        --domain)  CUSTOM_DOMAIN="$2"; shift 2 ;;
        *)         shift ;;
    esac
done

if [ -n "$INSTANCE_NAME" ]; then
    INSTALL_DIR="contypio-${INSTANCE_NAME}"
fi

# --- Colors ---------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "  ${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "  ${GREEN}[OK]${NC}    $*"; }
err()   { echo -e "  ${RED}[ERROR]${NC} $*"; }

# --- Helpers ---------------------------------------------------------------

generate_password() {
    openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c "${1:-20}"
}

generate_secret() {
    openssl rand -base64 48
}

docker_compose() {
    if docker compose version &>/dev/null; then
        docker compose "$@"
    elif command -v docker-compose &>/dev/null; then
        docker-compose "$@"
    else
        err "docker compose not found"
        exit 1
    fi
}

# --- Main ------------------------------------------------------------------

echo ""
echo -e "  ${BOLD}==========================================${NC}"
echo -e "  ${BOLD}  Contypio CMS — Installer${NC}"
echo -e "  ${BOLD}==========================================${NC}"
echo ""

# 1. Prerequisites
info "Checking prerequisites..."

missing=0
for cmd in docker git openssl; do
    if ! command -v "$cmd" &>/dev/null; then
        err "'$cmd' is not installed."
        missing=1
    fi
done

if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    err "'docker compose' is not available."
    missing=1
fi

if [ "$missing" -eq 1 ]; then
    echo ""
    err "Please install the missing tools and try again."
    exit 1
fi
ok "All prerequisites met."
echo ""

# 2. Clone
info "Setting up repository..."
if [ -d "$INSTALL_DIR" ]; then
    info "Directory '$INSTALL_DIR/' exists — pulling latest..."
    git -C "$INSTALL_DIR" pull --ff-only --quiet
else
    git clone --depth 1 --quiet "$REPO_URL" "$INSTALL_DIR"
fi
ok "Repository ready."
echo ""

# 3. Generate .env
info "Generating configuration..."
ENV_FILE="$INSTALL_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    info ".env already exists — keeping it."
    ADMIN_PASSWORD="(existing)"
    SHOW_CREDS=0
else
    DB_PASSWORD=$(generate_password 20)
    SECRET_KEY=$(generate_secret)
    ADMIN_PASSWORD=$(generate_password 16)

    cat > "$ENV_FILE" <<ENVEOF
# Contypio CMS — auto-generated configuration
# --------------------------------------------------

# Database
POSTGRES_DB=contypio
POSTGRES_USER=contypio
POSTGRES_PASSWORD=$DB_PASSWORD

# Security
SECRET_KEY=$SECRET_KEY

# Admin account (created on first startup)
DEFAULT_ADMIN_EMAIL=admin@localhost
DEFAULT_ADMIN_PASSWORD=$ADMIN_PASSWORD
DEFAULT_ADMIN_NAME=Admin

# Tenant
DEFAULT_TENANT_SLUG=default
DEFAULT_TENANT_NAME=My Website
DEFAULT_TENANT_DOMAIN=localhost

# Instance
COMPOSE_PROJECT_NAME=${INSTANCE_NAME:-contypio}

# Port (change if 3000 is taken)
CONTYPIO_PORT=${CUSTOM_PORT:-3000}

# Domain (for production behind reverse proxy)
CONTYPIO_DOMAIN=${CUSTOM_DOMAIN:-localhost}

# Seed demo content on first startup
SEED_DEMO=true
ENVEOF
    SHOW_CREDS=1
fi
ok "Configuration ready."
echo ""

# 4. Start
info "Starting Contypio..."
cd "$INSTALL_DIR"
COMPOSE_PROJECT_NAME="${INSTANCE_NAME:-contypio}" docker_compose up -d --build
cd ..
echo ""

# 5. Wait for health
EFFECTIVE_PORT="${CUSTOM_PORT:-3000}"
info "Waiting for API to be ready..."
RETRIES=30
HEALTH_URL="http://localhost:${EFFECTIVE_PORT}/health"
for i in $(seq 1 $RETRIES); do
    if curl -sf "$HEALTH_URL" &>/dev/null; then
        ok "API is healthy."
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        err "API did not become healthy in time."
        err "Check logs: cd $INSTALL_DIR && docker compose logs api"
        exit 1
    fi
    sleep 2
done
echo ""

# 6. Done
echo -e "  ${BOLD}==========================================${NC}"
echo -e "  ${GREEN}${BOLD}  Contypio CMS is running!${NC}"
echo -e "  ${BOLD}==========================================${NC}"
echo ""
echo -e "  Admin UI:   ${BOLD}http://localhost:${EFFECTIVE_PORT}${NC}"
echo -e "  API Docs:   ${BOLD}http://localhost:${EFFECTIVE_PORT}/docs${NC}"
echo -e "  Delivery:   ${BOLD}http://localhost:${EFFECTIVE_PORT}/content/${NC}"
echo ""

if [ "${SHOW_CREDS:-0}" -eq 1 ]; then
    echo -e "  ${BOLD}Login credentials:${NC}"
    echo -e "    Email:     admin@localhost"
    echo -e "    Password:  ${BOLD}$ADMIN_PASSWORD${NC}"
    echo ""
    echo -e "  ${RED}Save these credentials — they won't be shown again.${NC}"
    echo ""
fi

echo "  Useful commands:"
echo "    cd $INSTALL_DIR && docker compose logs -f    # View logs"
echo "    cd $INSTALL_DIR && docker compose stop       # Stop"
echo "    cd $INSTALL_DIR && docker compose down       # Stop + remove"
echo "    cd $INSTALL_DIR && docker compose down -v    # Reset everything"
echo ""
