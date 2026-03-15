"""Default Content Templates: 6 Services × 4 Kanäle = 24 Vorlagen."""

SERVICE_LABELS: dict[str, str] = {
    "webdesign": "Webdesign",
    "hosting": "Hosting",
    "legacy": "Legacy Modernisierung",
    "rescue": "Projekt-Rettung",
    "cto": "Fractional CTO",
    "python": "Python Modernisierung",
}

CHANNEL_LABELS: dict[str, str] = {
    "linkedin": "LinkedIn",
    "blog": "Blog-Intro",
    "newsletter": "Newsletter",
    "social": "Kurz-Post",
}

CHANNEL_TIPS: dict[str, dict[str, str]] = {
    "linkedin": {
        "Länge": "900–1300 Zeichen",
        "Format": "Hook → Problem → Lösung → Frage",
        "Hashtags": "3–5, am Ende",
        "Posting": "Di–Do, 7–9 Uhr",
    },
    "blog": {
        "Länge": "800–1500 Wörter",
        "Format": "Problem → Kontext → Lösung → CTA",
        "SEO": "Keyword in H1 + erstem Absatz",
        "Posting": "1× pro Woche",
    },
    "newsletter": {
        "Länge": "150–250 Wörter",
        "Format": "Betreff → Problem → Nutzen → Link",
        "Betreff": "Max. 50 Zeichen",
        "Versand": "Di oder Mi Vormittag",
    },
    "social": {
        "Länge": "max. 280 Zeichen",
        "Format": "Emoji-Hook → Punkt → CTA",
        "Hashtags": "1–2",
        "Posting": "Täglich möglich",
    },
}

TEMPLATES: dict[str, dict[str, str]] = {
    "webdesign": {
        "linkedin": (
            "Viele Unternehmen verlieren täglich potenzielle Kunden – weil ihre "
            "Website das Vertrauen nicht aufbaut, das nötig wäre.\n\n"
            "Ich sehe das regelmäßig: Seiten, die technisch laufen, aber im "
            "entscheidenden Moment nicht überzeugen.\n\n"
            "Was wirklich zählt:\n"
            "→ Klare Botschaft in den ersten 3 Sekunden\n"
            "→ Mobil-Performance, die nicht nervt\n"
            "→ Struktur, die zum nächsten Schritt führt\n\n"
            "Bei web-werkstatt.at entwickeln wir Websites, die nicht nur gut "
            "aussehen – sondern verkaufen.\n\n"
            "Welches Problem hat deine aktuelle Website? 👇\n\n"
            "#Webdesign #KMU #Österreich #WebWerkstatt"
        ),
        "blog": (
            "Warum deine Website deinen Umsatz bremst – und wie du das änderst\n\n"
            "Die meisten Unternehmenswebsites wurden irgendwann gebaut und dann "
            "vergessen. Das Problem: Das Web hat sich weiterentwickelt, deine "
            "Kunden haben sich weiterentwickelt – aber deine Seite nicht.\n\n"
            "In diesem Artikel zeigen wir, welche 5 Warnsignale darauf hindeuten, "
            "dass deine Website aktiv Aufträge verhindert."
        ),
        "newsletter": (
            "Betreff: Warum deine Website Kunden verscheucht (und wie du das in "
            "30 Tagen änderst)\n\n"
            "Hallo [Vorname],\n\n"
            "eine schlechte Website ist teurer als eine gute – das klingt "
            "offensichtlich, wird aber trotzdem ständig unterschätzt.\n\n"
            "Diese Woche bei web-werkstatt.at: 3 häufige Website-Fehler, die "
            "österreichische KMU Aufträge kosten.\n\n"
            "→ [Zum Artikel]\n\n"
            "Bis nächste Woche,\nJoseph | web-werkstatt.at"
        ),
        "social": (
            "💡 Deine Website hat 3 Sekunden.\n"
            "Danach ist der Besucher weg.\n\n"
            "Wir bauen Seiten, die in diesen 3 Sekunden überzeugen.\n\n"
            "web-werkstatt.at → Link in Bio"
        ),
    },
    "hosting": {
        "linkedin": (
            "\"Wartung? Die Seite läuft doch.\"\n\n"
            "Das höre ich oft – kurz bevor jemand anruft, weil seine Website "
            "down ist oder gehackt wurde.\n\n"
            "Managed Hosting bei web-werkstatt.at bedeutet:\n"
            "→ Tägliche Backups, die wirklich funktionieren\n"
            "→ SSL, Updates, Monitoring – alles inklusive\n"
            "→ Ansprechpartner auf Deutsch, nicht ein Ticketsystem\n\n"
            "Für viele unserer Kunden war die Umstellung der erste ruhige Schlaf "
            "seit Jahren.\n\n"
            "Was läuft bei dir gerade als \"es läuft schon irgendwie\"?\n\n"
            "#Webhosting #KMU #Österreich #Sicherheit"
        ),
        "blog": (
            "Österreichisches Webhosting: Was \"günstig\" wirklich kostet\n\n"
            "Drei Euro im Monat klingt gut – bis die Seite ausfällt und niemand "
            "erreichbar ist. Dieser Artikel zeigt, worauf es bei Hosting für "
            "österreichische Unternehmen wirklich ankommt."
        ),
        "newsletter": (
            "Betreff: Deine Website läuft – aber auf wessen Infrastruktur?\n\n"
            "Hallo [Vorname],\n\n"
            "viele Websites laufen auf Servern, deren Standort und Backup-Status "
            "der Inhaber nicht kennt. Das ist ein Risiko.\n\n"
            "Wir haben einen kurzen Check zusammengestellt, mit dem du in "
            "5 Minuten weißt, wie sicher dein Hosting wirklich ist.\n\n"
            "→ [Zum Hosting-Check]\n\n"
            "Grüße,\nJoseph | web-werkstatt.at"
        ),
        "social": (
            "🖥️ Deine Website um 2 Uhr down.\n"
            "Wen rufst du an?\n\n"
            "Mit web-werkstatt.at Hosting: uns.\n"
            "Österreichischer Support, kein Ticket-System.\n\n"
            "web-werkstatt.at"
        ),
    },
    "legacy": {
        "linkedin": (
            "\"Das System läuft seit 15 Jahren, wir können es nicht anfassen.\"\n\n"
            "Diesen Satz höre ich regelmäßig. Meistens steckt dahinter ein "
            "Unternehmen, das mehr in IT-Angst investiert als in IT-Entwicklung.\n\n"
            "Legacy-Modernisierung bedeutet nicht, alles wegzuwerfen.\n"
            "Es bedeutet:\n"
            "→ Schrittweise Migration ohne Betriebsunterbrechung\n"
            "→ Neue Technologie dort, wo sie Sinn macht\n"
            "→ Dokumentation, die das nächste Team versteht\n\n"
            "Wir haben einen 18-Wochen-Prozess entwickelt, der genau das liefert.\n\n"
            "Welches System in deinem Unternehmen verdient eigentlich schon "
            "länger eine Ablöse?\n\n"
            "#LegacyCode #Digitalisierung #Österreich #WebWerkstatt"
        ),
        "blog": (
            "Von Contao zu modernen Stacks: So gelingt Legacy-Migration ohne Panik\n\n"
            "Ein Praxisbericht aus einem Kundenprojekt – und was du daraus für "
            "deine eigene Migration mitnehmen kannst."
        ),
        "newsletter": (
            "Betreff: Das älteste System in deinem Unternehmen – Risiko oder "
            "Ressource?\n\n"
            "Hallo [Vorname],\n\n"
            "Legacy-Software ist nicht automatisch schlecht. Aber sie wird zum "
            "Problem, wenn niemand mehr weiß, wie sie funktioniert – oder wenn "
            "sie modernen Anforderungen im Weg steht.\n\n"
            "Wir zeigen diesen Monat unseren 18-Wochen-Modernisierungsprozess "
            "– Schritt für Schritt.\n\n"
            "→ [Zum Prozessartikel]\n\n"
            "Joseph | web-werkstatt.at"
        ),
        "social": (
            "⚙️ \"Das System läuft seit 12 Jahren.\"\n"
            "Und trotzdem weiß niemand genau wie.\n\n"
            "Wir modernisieren Legacy-Systeme – schrittweise, ohne Betriebsausfall.\n\n"
            "web-werkstatt.at"
        ),
    },
    "rescue": {
        "linkedin": (
            "\"Das Projekt ist in 6 Wochen fällig und die Agentur ist weg.\"\n\n"
            "Das klingt nach Katastrophe. Oft ist es lösbar.\n\n"
            "Was wir bei solchen Einsätzen als erstes tun:\n"
            "→ Codebase-Audit in 48 Stunden\n"
            "→ Realistischen Zeitplan erstellen (nicht den gewünschten)\n"
            "→ Prioritäten setzen: Was muss zum Launch, was kommt danach\n\n"
            "Kein Drama, kein Blame-Game – nur klare Analyse und Umsetzung.\n\n"
            "Hattest du schon mal ein Projekt, das kurz vor dem Abbruch stand?\n\n"
            "#Projektrettung #WebDevelopment #KMU #WebWerkstatt"
        ),
        "blog": (
            "Wenn die Agentur weg ist und der Launch naht: Ein Leitfaden für die "
            "Projekt-Rettung\n\n"
            "Was tun, wenn ein Webprojekt aus dem Ruder gelaufen ist? Wir zeigen "
            "den 6-Phasen-Prozess, den wir in kritischen Einsätzen verwenden."
        ),
        "newsletter": (
            "Betreff: Notfall-Einsatz – so retten wir laufende Webprojekte\n\n"
            "Hallo [Vorname],\n\n"
            "manchmal melden sich Kunden, deren Webprojekt in einer Sackgasse "
            "steckt. Falsche Technologiewahl, überforderte Agentur, unrealistische "
            "Timelines.\n\n"
            "Wir haben einen strukturierten Rettungsprozess entwickelt – und "
            "teilen ihn diese Woche.\n\n"
            "→ [Zum Artikel]\n\n"
            "Joseph | web-werkstatt.at"
        ),
        "social": (
            "🚨 Dein Webprojekt läuft aus dem Ruder?\n"
            "Deadline in 6 Wochen, Agentur weg?\n\n"
            "Wir analysieren und retten – in 48h weißt du, was möglich ist.\n\n"
            "web-werkstatt.at"
        ),
    },
    "cto": {
        "linkedin": (
            "Nicht jedes Unternehmen braucht einen Vollzeit-CTO.\n\n"
            "Aber fast jedes wächsende Unternehmen braucht irgendwann jemanden, der:\n"
            "→ Technische Entscheidungen bewertet, bevor sie teuer werden\n"
            "→ Agenturen und Entwickler brieft und kontrolliert\n"
            "→ Eine IT-Strategie aufbaut, die zum Unternehmen passt\n\n"
            "Als Fractional CTO bei web-werkstatt.at übernehme ich diese Rolle – "
            "stundenweise oder im Retainer, auf Augenhöhe mit deinem Team.\n\n"
            "Wann macht ein Fractional CTO für ein Unternehmen Sinn? Gerne in "
            "den Kommentaren diskutieren.\n\n"
            "#FractionalCTO #Österreich #Digitalisierung #WebWerkstatt"
        ),
        "blog": (
            "Fractional CTO: Was ist das – und wann brauche ich einen?\n\n"
            "Viele mittelständische Unternehmen treffen IT-Entscheidungen ohne "
            "technische Expertise. Das kostet mehr als ein externer CTO auf Zeit."
        ),
        "newsletter": (
            "Betreff: IT-Entscheidungen sicher treffen – ohne eigene IT-Abteilung\n\n"
            "Hallo [Vorname],\n\n"
            "welche Cloud-Lösung? Welche Agentur? Welcher Tech-Stack? Ohne "
            "technischen Background sind das Glücksspiele.\n\n"
            "Als Fractional CTO helfen wir Unternehmen, diese Entscheidungen "
            "fundiert zu treffen.\n\n"
            "→ [Mehr erfahren]\n\n"
            "Joseph | web-werkstatt.at"
        ),
        "social": (
            "👨\u200d💻 CTO-Expertise ohne CTO-Gehalt.\n\n"
            "Technische Entscheidungen, Agentur-Kontrolle, IT-Strategie – "
            "stundenweise.\n\n"
            "web-werkstatt.at · Fractional CTO"
        ),
    },
    "python": {
        "linkedin": (
            "Python 2 läuft noch? Oder ein Django-Monolith aus 2016, den niemand "
            "mehr anfassen will?\n\n"
            "Das ist kein Einzelfall. Es ist eines der häufigsten Probleme, die "
            "ich in Bestandsprojekten sehe.\n\n"
            "Unser 9-Wochen-Prozess für Python-Modernisierung umfasst:\n"
            "→ Vollständiges Dependency- und Sicherheits-Audit\n"
            "→ Schrittweise Migration mit automatisierten Tests\n"
            "→ Blue-Green-Deployment für null Downtime\n\n"
            "Das Ergebnis: ein System, das dein Team wieder gerne anfasst.\n\n"
            "Welche Python-Version läuft bei dir noch \"irgendwie\" in Produktion?\n\n"
            "#Python #BackendDevelopment #TechDebt #WebWerkstatt"
        ),
        "blog": (
            "Python 2 in Produktion – warum das kein theoretisches Problem mehr ist\n\n"
            "Sicherheitslücken, fehlende Library-Support, Recruiting-Probleme: "
            "Was Legacy-Python in der Praxis bedeutet, und wie eine saubere "
            "Migration aussieht."
        ),
        "newsletter": (
            "Betreff: Tech Debt in Python – was er wirklich kostet\n\n"
            "Hallo [Vorname],\n\n"
            "veraltete Python-Projekte sind teurer als sie aussehen: langsamere "
            "Entwicklung, Sicherheitsrisiken, schwieriges Onboarding.\n\n"
            "Wir zeigen diesen Monat unseren 9-Wochen-Migrationsprozess – "
            "inklusive konkreter Tool-Empfehlungen.\n\n"
            "→ [Zum Artikel]\n\n"
            "Joseph | web-werkstatt.at"
        ),
        "social": (
            "🐍 Python 2 in Produktion?\n"
            "Das ist kein Vintage-Trend.\n\n"
            "Wir migrieren sauber – 9 Wochen, kein Ausfall, kein Drama.\n\n"
            "web-werkstatt.at"
        ),
    },
}
