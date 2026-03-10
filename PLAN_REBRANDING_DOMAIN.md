# Plan: Contypio - Rebranding + Domain-Setup

## Context

Das Headless CMS (bisher "CMS Lite") bekommt den Produktnamen **Contypio**. Die Domain `contypio.com` wurde bei ALL-INKL.COM registriert. Ziel: Schrittweise vom internen CMS zur eigenen Produktmarke, spaeter ggf. Self-Service SaaS.

Dieser Plan deckt **Phase 1 (Rebranding)** und **Phase 2 (Domain/Infra)** ab. Die Landing Page (separates Projekt, nicht in proj_irtours) wird in einem Folgeplan behandelt.

---

## Phase 1: Rebranding "CMS Lite" -> "Contypio"

14 Stellen im Code ersetzen:

### Frontend (cms-python/frontend/)

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `index.html` | 6 | `<title>CMS Lite - IR-Tours</title>` | `<title>Contypio</title>` |
| `src/contexts/TenantContext.tsx` | 15 | `name: 'CMS Lite'` | `name: 'Contypio'` |
| `src/contexts/TenantContext.tsx` | 67 | `${branding.name} - CMS` | `${branding.name} - Contypio` |
| `src/hooks/useTenant.ts` | 23-24 | `'CMS Lite'` (2x) | `'Contypio'` |

### Backend (cms-python/backend/)

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `app/main.py` | 79 | `title="Python CMS Lite"` | `title="Contypio"` |

### Hilfe-Center (cms-python/hilfe-center/)

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `templates/base.html` | 19 | `CMS Lite` | `Contypio` |
| `templates/index.html` | 16 | `Python CMS Lite` | `Contypio` |
| `templates/index.html` | 115 | `CMS Lite v1.0` | `Contypio v1.0` |
| `app.py` | 3 | `CMS Lite` | `Contypio` |
| `content/_config.yaml` | 1 | `CMS Lite` | `Contypio` |
| `static/css/style.css` | 3 | `CMS Lite` | `Contypio` |

### Dokumentation

| Datei | Alt | Neu |
|-------|-----|-----|
| `FEATURES.md` | Alle "CMS Lite" (6x) | `Contypio` |

### Infrastruktur

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `infrastructure/docker/Caddyfile.irtours` | 47 | `Python CMS Lite` (Kommentar) | `Contypio` |

---

## Phase 2: Domain + Infrastruktur

### 2.1 DNS bei ALL-INKL.COM

A-Records anlegen (Ziel: `176.9.1.186`):

| Record | Typ | Wert |
|--------|-----|------|
| `contypio.com` | A | 176.9.1.186 |
| `www.contypio.com` | A | 176.9.1.186 |
| `app.contypio.com` | A | 176.9.1.186 |

> DNS-Propagation kann bis zu 24-48h dauern. Caddy provisioniert SSL automatisch sobald DNS aufloest.

### 2.2 Caddy-Konfiguration

In `infrastructure/docker/Caddyfile.irtours` anfuegen:

```caddy
# Contypio - CMS Application
app.contypio.com {
	reverse_proxy irtours-cms:8060
	encode gzip

	header {
		X-Content-Type-Options nosniff
		X-Frame-Options SAMEORIGIN
		Referrer-Policy strict-origin-when-cross-origin
		-Server
	}
}

# Contypio - Landing Page (Platzhalter bis Astro-Projekt steht)
contypio.com, www.contypio.com {
	respond "Contypio - Coming Soon" 200
}
```

### 2.3 CORS aktualisieren

In `infrastructure/docker/docker-compose.proxmox.yml` beim `irtours-cms` Service `https://app.contypio.com` zur CORS_ORIGINS hinzufuegen.

### 2.4 Deploy

```bash
# Rebranding deployen
./infrastructure/deploy/deploy-proxmox.sh sync cms           # Backend
./infrastructure/deploy/deploy-proxmox.sh sync cms-frontend  # Frontend

# Caddy-Config deployen
./infrastructure/deploy/deploy-proxmox.sh sync compose       # docker-compose
# Caddyfile manuell auf Server kopieren + caddy reload
```

---

## Dateien-Uebersicht

| Datei | Aktion |
|-------|--------|
| `cms-python/frontend/index.html` | AENDERN |
| `cms-python/frontend/src/contexts/TenantContext.tsx` | AENDERN |
| `cms-python/frontend/src/hooks/useTenant.ts` | AENDERN |
| `cms-python/backend/app/main.py` | AENDERN |
| `cms-python/hilfe-center/templates/base.html` | AENDERN |
| `cms-python/hilfe-center/templates/index.html` | AENDERN |
| `cms-python/hilfe-center/app.py` | AENDERN |
| `cms-python/hilfe-center/content/_config.yaml` | AENDERN |
| `cms-python/hilfe-center/static/css/style.css` | AENDERN |
| `cms-python/FEATURES.md` | AENDERN |
| `infrastructure/docker/Caddyfile.irtours` | AENDERN |
| `infrastructure/docker/docker-compose.proxmox.yml` | AENDERN |

---

## Verifizierung

1. `cd cms-python/frontend && npm run build` - Build fehlerfrei
2. `grep -r "CMS Lite" cms-python/` - Keine Treffer mehr
3. Login-Seite zeigt "Contypio" im Titel
4. Nach Tenant-Login zeigt Title "{TenantName} - Contypio"
5. FastAPI Docs (`/docs`) zeigt "Contypio" als API-Titel
6. Hilfe-Center zeigt "Contypio" in Header und Footer

---

## Nicht in diesem Plan (Folgeplaene)

- **Landing Page**: Separates Astro-Projekt (eigener Ordner, nicht proj_irtours)
- **Contypio-Tenant**: Tenant "contypio" in DB anlegen fuer Dogfooding
- **Logo/Favicon**: Design fuer Contypio-Marke
- **Self-Service SaaS**: Onboarding-Wizard UI, Signup auf Landing Page
