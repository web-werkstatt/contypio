# Sprint: Self-Hosted Install (Docker)

**Issue:** GitHub-Installierbarkeit
**Prioritaet:** HIGH
**Status:** DONE

---

## Ziel

Contypio CMS in einem Befehl installierbar:
```bash
curl -fsSL https://get.contypio.com | bash
# oder
git clone + docker compose up -d
```
Admin UI auf http://localhost:3000.

---

## Tasks

| # | Task | Datei(en) | Status |
|---|------|-----------|--------|
| 1.1 | docker-compose.yml — Production-ready, Port 3000 | docker-compose.yml | DONE |
| 1.2 | docker-compose.dev.yml — Dev-Overrides (Ports 8060/7460, hot-reload) | docker-compose.dev.yml | DONE |
| 1.3 | install.sh — curl\|bash Installer (prereq-check, .env-gen, docker up) | install.sh | DONE |
| 1.4 | .env.example — Alle Keys dokumentiert | .env.example | DONE |
| 1.5 | Backend Dockerfile — Production (workers, kein reload) | backend/Dockerfile | DONE |
| 1.6 | Frontend nginx.conf — Proxy zu api (statt cms-api), health/docs Proxy | frontend/nginx.conf | DONE |

---

## Architektur

```
                    Port 3000
                       |
                    [nginx]  (frontend/admin container)
                    /  |  \
                   /   |   \
            /api/  /content/  /uploads/  → [api:8060] (backend container)
              |
         [postgres:5432]
```

- Ein einziger externer Port (3000)
- nginx routet: Static Files (Admin UI) + API/Content/Uploads Proxy
- PostgreSQL nur intern erreichbar

## Install-Flow

```
curl -fsSL https://get.contypio.com | bash
  1. Prüft: docker, git, openssl
  2. git clone --depth 1
  3. Generiert .env (Passwörter, Secret Key)
  4. docker compose up -d --build
  5. Wartet auf /health
  6. Zeigt Credentials
```

---

## Dateien

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Production: postgres + api + admin (Port 3000) |
| `docker-compose.dev.yml` | Dev: Extra-Ports (8060, 7460), hot-reload, host.docker.internal |
| `install.sh` | One-command installer (curl\|bash) |
| `.env.example` | Dokumentierte Config-Keys |
| `backend/Dockerfile` | Python 3.13, uvicorn, 2 workers |
| `frontend/Dockerfile` | Node build + nginx |
| `frontend/nginx.conf` | SPA + API reverse proxy |
