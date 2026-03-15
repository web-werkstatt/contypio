#!/usr/bin/env bash
# Contypio CMS Deploy Script
# Deployt Backend + Frontend auf Production Server
# Server: 176.9.1.186 (pve3) -> Docker-VM 10.10.10.100

set -euo pipefail

# ========================================
# KONFIGURATION
# ========================================
SSH_HOST="irtours-docker"
REMOTE_DIR="/opt/ir-tours"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
LANDING_DIR="${PROJECT_ROOT}/infrastructure/landing"
CMS_SERVICE="irtours-cms"
CMS_ADMIN_SERVICE="irtours-cms-admin"
HEALTH_URL="https://cms.ir-tours.de/health"
HEALTH_TIMEOUT=30

# Landing page (SaaS Server — volume-mounted in Caddy container)
LANDING_SSH_HOST="docker-vm"
LANDING_REMOTE_DIR="/data/contypio-launch"
LANDING_URL="https://headless-cms.webideas24.com/"

# ========================================
# FARBEN + HILFSFUNKTIONEN
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[FEHLER]${NC} $*"; }
step()    { echo -e "\n${BOLD}>>> $*${NC}"; }

timer_start() { STEP_START=$(date +%s); }
timer_end() {
    local elapsed=$(( $(date +%s) - STEP_START ))
    echo -e "    ${BLUE}(${elapsed}s)${NC}"
}

# ========================================
# PRE-FLIGHT CHECKS
# ========================================
preflight() {
    step "Pre-Flight Checks"

    if ! command -v ssh &>/dev/null; then
        error "SSH nicht gefunden"
        exit 1
    fi

    if ! command -v rsync &>/dev/null; then
        error "rsync nicht gefunden"
        exit 1
    fi

    if ! ssh -o ConnectTimeout=10 "${SSH_HOST}" "echo ok" &>/dev/null; then
        error "SSH zu ${SSH_HOST} fehlgeschlagen"
        echo "  Prüfe: ssh ${SSH_HOST}"
        exit 1
    fi
    success "SSH zu ${SSH_HOST} OK"
}

# ========================================
# HEALTH CHECK
# ========================================
health_check() {
    local name="$1"
    local url="$2"

    step "Health Check: ${name}"
    timer_start

    local elapsed=0
    while [[ ${elapsed} -lt ${HEALTH_TIMEOUT} ]]; do
        if curl -sf --max-time 5 "${url}" &>/dev/null; then
            success "${name} antwortet auf ${url}"
            timer_end
            return 0
        fi
        sleep 2
        elapsed=$(( elapsed + 2 ))
    done

    error "${name} antwortet NICHT nach ${HEALTH_TIMEOUT}s"
    timer_end
    return 1
}

# ========================================
# SYNC: BACKEND (Python Code)
# ========================================
sync_backend() {
    step "Quick-Sync: Contypio Backend (rsync)"
    timer_start

    info "Sync app/ -> ${SSH_HOST}:${REMOTE_DIR}/cms-app/"
    rsync -avz --delete \
        "${BACKEND_DIR}/app/" \
        "${SSH_HOST}:${REMOTE_DIR}/cms-app/"
    success "Backend Code synchronisiert"

    info "Restart ${CMS_SERVICE}"
    ssh "${SSH_HOST}" "docker restart ${CMS_SERVICE}"
    success "Container neu gestartet"
    timer_end

    health_check "Contypio API" "${HEALTH_URL}"
}

# ========================================
# SYNC: FRONTEND (Build + rsync)
# ========================================
sync_frontend() {
    step "Quick-Sync: Contypio Frontend (build + rsync)"
    timer_start

    info "npm run build"
    cd "${FRONTEND_DIR}"
    npm run build
    cd "${PROJECT_ROOT}"

    info "Sync dist/ -> ${SSH_HOST}:${REMOTE_DIR}/cms-admin-dist/"
    rsync -avz --delete \
        "${FRONTEND_DIR}/dist/" \
        "${SSH_HOST}:${REMOTE_DIR}/cms-admin-dist/"
    success "Frontend synchronisiert"

    info "Restart ${CMS_ADMIN_SERVICE}"
    ssh "${SSH_HOST}" "docker restart ${CMS_ADMIN_SERVICE}"
    success "Container neu gestartet"
    timer_end
}

# ========================================
# SYNC: LANDING PAGE (SaaS Server)
# ========================================
sync_landing() {
    step "Quick-Sync: Contypio Landing Page (build + rsync)"
    timer_start

    info "Generating index.html from template + repo data"
    python3 "${PROJECT_ROOT}/infrastructure/landing/build.py"
    success "HTML generiert"

    info "Sync landing/ -> ${LANDING_SSH_HOST}:${LANDING_REMOTE_DIR}/"
    rsync -avz \
        "${LANDING_DIR}/index.html" \
        "${LANDING_SSH_HOST}:${LANDING_REMOTE_DIR}/"
    success "Landing Page synchronisiert"
    timer_end

    info "Checking ${LANDING_URL}"
    if curl -sf --max-time 5 "${LANDING_URL}" &>/dev/null; then
        success "Landing Page erreichbar"
    else
        warn "Landing Page nicht erreichbar (evtl. Cache)"
    fi
}

# ========================================
# SYNC: BEIDE (Backend + Frontend)
# ========================================
sync_all() {
    sync_backend
    sync_frontend
}

# ========================================
# STATUS
# ========================================
cmd_status() {
    step "Container-Status"
    ssh "${SSH_HOST}" "docker ps --filter 'name=irtours-cms' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
}

# ========================================
# LOGS
# ========================================
cmd_logs() {
    local service="${1:-backend}"
    case "${service}" in
        backend|api)  ssh "${SSH_HOST}" "docker logs ${CMS_SERVICE} --tail 50" ;;
        frontend|admin) ssh "${SSH_HOST}" "docker logs ${CMS_ADMIN_SERVICE} --tail 50" ;;
        *)
            error "Unbekannter Service: ${service}"
            echo "  Verfuegbar: backend, frontend"
            exit 1
            ;;
    esac
}

# ========================================
# USAGE
# ========================================
usage() {
    cat <<HELP
${BOLD}Contypio Deploy Script${NC}

${BOLD}Usage:${NC}
  ./deploy.sh <command> [option]

${BOLD}Quick-Sync (rsync, ~5-15s):${NC}
  sync backend      Python Code rsync + Restart
  sync frontend     npm build + dist rsync + Restart
  sync landing      Landing Page auf SaaS-Server
  sync all          Backend + Frontend

${BOLD}Monitoring:${NC}
  status            Container-Status anzeigen
  logs backend      Backend Logs (letzte 50 Zeilen)
  logs frontend     Frontend Logs (letzte 50 Zeilen)
  health            Health-Check ausfuehren

${BOLD}Beispiele:${NC}
  ./deploy.sh sync backend      # Nur Python-Code deployen
  ./deploy.sh sync frontend     # Frontend bauen + deployen
  ./deploy.sh sync all          # Beides
  ./deploy.sh status            # Container pruefen
  ./deploy.sh logs backend      # Logs anschauen

${BOLD}Server:${NC}
  SSH: ${SSH_HOST} (176.9.1.186 -> 10.10.10.100)
  Remote: ${REMOTE_DIR}/cms-app/ (Backend)
  Remote: ${REMOTE_DIR}/cms-admin-dist/ (Frontend)
  Health: ${HEALTH_URL}
HELP
}

# ========================================
# MAIN
# ========================================
main() {
    local command="${1:-}"
    local TOTAL_START
    TOTAL_START=$(date +%s)

    case "${command}" in
        sync)
            local sub="${2:-}"
            preflight
            case "${sub}" in
                backend|api)     sync_backend ;;
                frontend|admin)  sync_frontend ;;
                landing)         sync_landing ;;
                all)             sync_all ;;
                *)
                    error "Unbekannter sync-Befehl: ${sub}"
                    echo "  Verfuegbar: backend, frontend, landing, all"
                    exit 1
                    ;;
            esac
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "${2:-}"
            ;;
        health)
            preflight
            health_check "Contypio API" "${HEALTH_URL}"
            ;;
        -h|--help|help|"")
            usage
            exit 0
            ;;
        *)
            error "Unbekannter Command: ${command}"
            usage
            exit 1
            ;;
    esac

    if [[ "${command}" == "sync" ]]; then
        local total_elapsed=$(( $(date +%s) - TOTAL_START ))
        echo ""
        echo -e "${GREEN}${BOLD}Deploy abgeschlossen in ${total_elapsed}s${NC}"
    fi
}

main "$@"
