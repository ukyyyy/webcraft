# WebCraft

Eine kleine, browserbasierte Minecraft-Interpretation. Starte einen beliebigen lokalen Webserver (z. B. `npx serve .`) im Projektverzeichnis und öffne anschließend `http://localhost:3000` (oder den entsprechenden Port), um die Welt zu betreten.

## Features

- Prozedural generierte Blockwelt mit Hügeln, Höhlen und zufälligen Bäumen
- Editierbare Umgebung mit platzier- und abbaubaren Blöcken
- Mehrere Blocktypen (Gras, Erde, Stein, Holz, Laub, Sand)
- Pointer-Lock-Steuerung mit freier Kamera
- Taghelles Ambiente mit Sonnenlicht und Nebel
- Modernes Startmenü mit Welt-Generator-Einstellungen

## Menü & Einstellungen

Beim Laden der Seite erscheint ein halbtransparentes Menü mit folgenden Optionen:

- **Spiel starten / Weiter spielen**: Aktiviert die Pointer-Lock-Steuerung oder kehrt nach ESC zurück ins Spiel.
- **Neue Welt generieren**: Baut die Welt mit den aktuell gewählten Parametern neu auf.
- **Seed**: Bestimmt die zufällige Welt. Über den Button „Zufall“ lässt sich schnell ein neuer Seed erzeugen.
- **Weltgröße & Höhe**: Legt Breite/Tiefe sowie die vertikale Ausdehnung der Welt fest.
- **Geländerauheit**: Steuert die Varianz der Höhenzüge.
- **Höhlendichte**: Regelt, wie viele unterirdische Hohlräume generiert werden.
- **Baumdichte**: Bestimmt, wie viele Bäume pro Chunk erscheinen.

Alle Änderungen an den Schiebereglern werden durch einen Klick auf „Neue Welt generieren“ übernommen oder automatisch angewendet, wenn du mit geänderten Werten auf „Spiel starten“ klickst.

## Steuerung

- **WASD**: Bewegung
- **Shift**: Sprinten
- **Leertaste**: Springen
- **Linksklick**: Block abbauen
- **Rechtsklick**: Block platzieren
- **Mausrad**: Blocktyp wechseln

Viel Spaß beim Erkunden und Bauen!
