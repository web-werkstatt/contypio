# Contypio - Feature-Uebersicht

**Version:** 1.0 | **Stand:** Maerz 2026
**Live-Demo:** https://cms.ir-tours.de/

---

## Auf einen Blick

Contypio ist ein modernes, schlankes Content-Management-System fuer Websites. Es kombiniert einen visuellen Seiten-Editor mit flexiblen Daten-Collections - ohne die Komplexitaet grosser Enterprise-CMS-Systeme.

---

## 1. Seiten-Editor (Page Builder)

### Visueller Section-Editor
- Seiten bestehen aus **Sections** mit konfigurierbarem Layout
- **6 Layout-Optionen:** Volle Breite, 50/50, 2/3+1/3, 1/3+2/3, 3 Spalten, 4 Spalten
- Drag & Drop Sortierung von Sections und Blocks
- Visuelle Grid-Proportionen direkt im Editor sichtbar

### 15 Block-Typen in 4 Kategorien

**Inhalt:**
- Hero-Banner (Bild + Text + Call-to-Action)
- Rich Text (WYSIWYG-Editor mit Formatierung)
- Bild (einzelnes Bild mit Alt-Text)
- Galerie (Bildersammlung im Grid)
- Karten (Content-Cards mit Bild + Text)
- Call-to-Action (Button-Bereich)
- FAQ (Frage-Antwort Akkordeon)
- Newsletter (Anmeldeformular)

**Reisen:**
- Ausgewaehlte Reisen (handverlesene Reise-Auswahl)
- Reiseliste (gefilterte Reise-Uebersicht)
- Reiseziel-Kacheln (Kontinent/Land-Navigation)
- Inspiration-Kacheln (thematische Einstiege)

**Marketing:**
- Trust-Leiste (Auszeichnungen, Siegel, Partner)
- Hero Slider (Vollbild-Slideshow)

**Magazin:**
- Magazin-Teaser (Blog-Artikel Vorschau)

### Section Presets (Turbo fuer Redakteure)
- **10 vorgefertigte Sections** in 3 Kategorien
- Ein Klick = komplette Section mit Blocks fertig konfiguriert
- Kategorien: Inhalt (Hero, Text+Bild, FAQ, Karten), Reisen (Reiseliste, Reiseziel-Kacheln), Marketing (Trust, Newsletter, CTA)
- Alternativ: Leere Section mit Layout-Auswahl

### Daten-Blocks (Automatische Inhalte)
- Reise-Blocks koennen **automatisch oder manuell** befuellt werden
- **Automatisch:** Filter setzen (Kontinent, Land, Thema) - Inhalte bleiben aktuell
- **Manuell:** Einzelne Reisen per ID oder Auto-Fill auswaehlen
- Vorschau-Button: Zeigt live, wie viele Reisen den Filtern entsprechen
- Delivery API loest Daten-Blocks serverseitig auf - Frontend bekommt fertige Daten

### Page Assembly Wizard
- **7 Seitentypen** zur Auswahl (Inhaltsseite, Landing Page, Portal, ...)
- **11 Presets** als Startpunkt (fertige Seitenvorlagen)
- 4-Schritte-Wizard: Typ waehlen -> Preset waehlen -> Anpassen -> Fertig
- Jedes Preset kann nach Erstellung frei angepasst werden

### SEO-Verwaltung
- SEO-Titel mit Zeichenzaehler (max. 60)
- Meta-Description mit Zeichenzaehler (max. 160)
- Eigener Tab im Editor fuer SEO-Einstellungen

### Preview
- Vorschau-Panel direkt im Editor
- 3 Viewports: Desktop, Tablet, Mobile
- Zeigt den aktuellen Stand inkl. ungespeicherter Aenderungen

---

## 2. Collections (Daten-Sammlungen)

### Was sind Collections?
Collections sind strukturierte Datensammlungen - vergleichbar mit Datenbank-Tabellen, aber ohne technisches Wissen bedienbar. Beispiele: Reiseziele, Team-Mitglieder, Kundenbewertungen, FAQ-Eintraege.

### Dynamische Formulare
- Felder werden per Schema definiert - das Eingabeformular generiert sich automatisch
- Pflichtfelder, Validierung und Platzhalter-Texte konfigurierbar
- Neue Eintraege per Dialog erstellen und bearbeiten

### 16 Feldtypen

| Feldtyp | Eingabe | Beispiel |
|---------|---------|----------|
| Text | Einzeilig | Name, Titel |
| E-Mail | Mit Validierung | info@firma.de |
| Telefon | Mit Muster | +49 123 456789 |
| URL | Mit Validierung | https://... |
| Zahl | Numerisch | Preis, Menge |
| Datum | Datumswaehler | Reisedatum |
| Textarea | Mehrzeilig | Beschreibung |
| Rich Text | Formatiert | Artikel-Text |
| Auswahl | Dropdown | Kategorie |
| Toggle | An/Aus | Aktiv/Inaktiv |
| Farbe | Farbwaehler | Markenfarbe |
| Media-Picker | Bild waehlen | Profilfoto |
| Gruppe | Felder buendeln | Adresse (Strasse + PLZ + Ort) |
| Repeater | Wiederholbar | Mehrere Telefonnummern |

### Schema-Editor
- Collections per Oberflaeche erstellen und anpassen
- Felder per Dropdown hinzufuegen (Preset-Auswahl)
- Feldtyp bestimmt automatisch Eingabekomponente + Validierung
- Keine Programmierung noetig

### Erweiterbar ohne Entwickler
- Neue Feldtypen koennen per Datenbank-Eintrag hinzugefuegt werden
- Erscheinen sofort im Dropdown - kein Code-Deploy, kein Neustart
- Beispiel: "Waehrung" als Zahl-Feld mit 2 Nachkommastellen und EUR-Prefix

### Seiten-Verknuepfung
- Jede Seite kann mit einer Collection verknuepft werden
- Die Delivery-API liefert die Collection-Daten automatisch mit
- Beispiel: Seite "Reiseziele" zeigt automatisch alle Reiseziel-Eintraege

---

## 3. Globals (Globale Einstellungen)

### Site Settings
- Firmenname, Tagline, Logo
- Kontakt-E-Mail, Telefon, Adresse
- Aenderungen wirken sich auf die gesamte Website aus

### Navigation
- Hauptmenue mit Unterpunkten
- Footer-Links
- Menuepunkte hinzufuegen, bearbeiten, loeschen
- Verschachtelung (Parent/Child Menuepunkte)

### Social Media
- Instagram, Facebook, YouTube, TikTok URLs
- Zentral gepflegt, ueberall auf der Website verfuegbar

---

## 4. Media Library

### Bildverwaltung
- **Grid- und Listen-Ansicht** mit Umschaltung
- **Drag & Drop Upload** (mehrere Dateien gleichzeitig)
- Fortschrittsanzeige beim Upload
- Kategorien und Suche

### Automatische Bildoptimierung
- Konvertierung nach **WebP** (kleinere Dateien, schnellere Ladezeiten)
- Automatische **Thumbnails** in 3 Groessen (400px, 800px, 1200px)
- Browser waehlt automatisch die passende Groesse

### Detail-Panel
- Bildvorschau in Originalgrösse
- Alt-Text und Beschreibung bearbeiten
- Kategorie zuweisen
- **Verwendungs-Check:** Zeigt auf welchen Seiten ein Bild verwendet wird

### Media-Picker
- In jedem Block-Editor und Collection-Formular verfuegbar
- Bild aus der Library waehlen oder direkt hochladen
- Vorschau des gewaehlten Bildes

---

## 5. Seitenbaum

- Hierarchische Darstellung aller Seiten
- Aufklappbar (Parent/Child Beziehungen)
- Statusanzeige (Publiziert/Entwurf)
- Direkter Zugriff per Klick auf den Editor
- Neue Seiten per Wizard erstellen

---

## 6. Dashboard

- Uebersicht: Seiten (Publiziert/Entwurf), Media-Dateien, Collections
- Schnellzugriff: Neue Seite, Media Upload, Collections
- Letzte Aenderungen auf einen Blick

---

## 7. Benutzerverwaltung

- Login mit E-Mail und Passwort
- JWT-basierte Authentifizierung (automatische Token-Erneuerung)
- Rollen: Admin, Redakteur
- Sichere Passwort-Speicherung (Argon2)

---

## 8. Delivery API (Datenausgabe)

Die Website (Frontend) bezieht alle Inhalte ueber eine standardisierte Schnittstelle:

| Endpunkt | Beschreibung |
|----------|-------------|
| `/content/page` | Einzelne Seite mit allen Sections und Blocks |
| `/content/tree` | Kompletter Seitenbaum |
| `/content/collection/{name}` | Alle Eintraege einer Collection |
| `/content/globals/{name}` | Globale Einstellung (Navigation, Settings, ...) |

- Nur publizierte Inhalte werden ausgeliefert
- Bilder werden automatisch mit vollstaendigen URLs aufgeloest
- Kein Login erforderlich (oeffentlich lesbar)

---

## 9. Technische Highlights

| Eigenschaft | Detail |
|-------------|--------|
| **Hosting** | Eigener Server (kein Cloud-Zwang, volle Datenkontrolle) |
| **Performance** | Schnelle API-Antworten, optimierte Bilder |
| **Sicherheit** | Verschluesseltes Login, Input-Validierung, SQL-Injection-Schutz |
| **Backup** | Datenbank auf eigenem Server, regelmaessig sicherbar |
| **Erweiterbar** | Neue Collections, Feldtypen und Globals ohne Code-Aenderungen |
| **Multi-Site** | Architektur unterstuetzt mehrere Websites (mandantenfaehig) |
| **Astro-Integration** | Optimiert fuer statische Website-Generierung (schnellste Ladezeiten) |

---

## Vergleich: Contypio vs. gaengige Alternativen

| Feature | Contypio | WordPress | Payload CMS | Strapi |
|---------|----------|-----------|-------------|--------|
| Visueller Page Builder | Ja (Sections + Blocks) | Nur mit Plugins | Ja | Nein |
| Dynamische Collections | Ja (per UI) | Nur mit Plugins | Ja (per Code) | Ja (per UI) |
| Feldtypen erweiterbar ohne Code | Ja | Nein | Nein | Nein |
| Automatische Bildoptimierung | Ja (WebP + Thumbnails) | Nur mit Plugins | Teilweise | Teilweise |
| Eigener Server (DSGVO) | Ja | Ja | Ja | Ja |
| Collection-Seiten-Verknuepfung | Ja (automatisch) | Manuell | Manuell | Manuell |
| Komplexitaet | Niedrig | Mittel | Hoch | Mittel |
| Monatliche Kosten | Nur Hosting | Hosting + Plugins | Hosting | Hosting + ggf. Cloud |

---

*Contypio wird aktiv weiterentwickelt. Funktionswuensche und Anpassungen sind jederzeit moeglich.*
