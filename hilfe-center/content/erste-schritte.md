---
title: "Erste Schritte"
icon: "rocket-takeoff"
description: "Login, erste Seite erstellen, veröffentlichen"
section: "Contypio verstehen"
tags: [erste-schritte, getting-started, login, seite, erstellen]
order: 2
tips:
  - "Nach dem ersten Login führt der Onboarding-Wizard durch die Grundeinrichtung"
  - "Seiten müssen explizit veröffentlicht werden, bevor sie über die API abrufbar sind"
  - "Die Live-Vorschau zeigt auch unveröffentlichte Änderungen"
---

## Login

Contypio wird über den Browser bedient. Nach der Installation ist das Admin UI unter der konfigurierten URL erreichbar (z.B. `cms.example.com`).

**Zugangsdaten:**
- Bei Self-Hosted: Der Standard-Admin wird beim ersten Start automatisch erstellt (konfiguriert über Umgebungsvariablen)
- Bei Cloud: Zugangsdaten werden bei der Registrierung vergeben

Login-Formular: E-Mail + Passwort eingeben. Nach erfolgreichem Login erscheint das Dashboard.

## Dashboard

Das Dashboard zeigt:
- Übersicht aller Seiten (veröffentlicht und Entwürfe)
- Schnellzugriff auf häufige Aktionen
- Seitenbaum mit Drag & Drop zum Umsortieren

## Erste Seite erstellen

### 1. Neue Seite anlegen
- Im Dashboard auf „Neue Seite" klicken
- Titel eingeben (Slug wird automatisch generiert)
- Seitentyp wählen (Content-Seite oder Collection-Seite)

### 2. Sections hinzufügen
- Im Section Editor auf „Section hinzufügen" klicken
- Section-Typ wählen (z.B. Text, Bild-Text, Hero)
- Blöcke innerhalb der Section konfigurieren
- Reihenfolge per Drag & Drop ändern

### 3. SEO-Felder ausfüllen
- SEO-Titel und Meta-Description eintragen
- Diese Felder werden in der Delivery API mitgeliefert

### 4. Speichern
- „Speichern" sichert die Änderungen als Entwurf
- Die Seite ist noch nicht öffentlich

### 5. Veröffentlichen
- „Veröffentlichen" klicken, um die Seite über die Delivery API verfügbar zu machen
- Erst nach Veröffentlichung liefert `/content/page?slug=...` diese Seite aus

## Medien hochladen

1. Im Menü auf „Medien" klicken
2. Dateien per Drag & Drop oder Dateiauswahl hochladen
3. Alt-Text und Kategorie vergeben
4. Hochgeladene Bilder können in Sections und Collections verwendet werden

## Globals bearbeiten

Globals sind seitenübergreifende Einstellungen (z.B. Navigation, Footer):

1. Im Menü den gewünschten Global-Eintrag öffnen
2. Felder bearbeiten
3. Speichern — Globals sind sofort über die API abrufbar

## Collections verwalten

Collections sind Listen mit strukturierten Einträgen:

1. Im Menü auf „Collections" klicken
2. Eine bestehende Collection öffnen oder neue erstellen
3. Einträge hinzufügen, bearbeiten oder löschen
4. Collections sind über `/content/collection/{key}` abrufbar

## Nächste Schritte

- **Delivery API:** Wie Inhalte per API abgerufen werden → Topic „API-Übersicht"
- **Schema Builder:** Eigene Collections und Feldtypen definieren → Topic „Collections verwalten"
- **Import:** Bestehende Daten importieren → Topic „Import & Export"
