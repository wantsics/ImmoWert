# ImmoWert

## Zielsetzung

ImmoWert ist ein transparentes Bewertungs- und Analysewerkzeug für Immobilien mit Fokus auf:

- Ertragswertverfahren
- Bodenwertanalyse
- Datenerhebung / Flächenermittlung
- spätere Erweiterung um Sachwertverfahren
- nachvollziehbare und gutachterähnliche Rechenlogik

Der Fokus liegt bewusst nicht auf einem simplen "Online-Rechner", sondern auf einem nachvollziehbaren Werkzeug mit transparenter Herleitung der Bewertungsparameter.

---

# Grundidee

Viele Marktteilnehmer bewerten Immobilien aktuell vereinfacht über:

- Wohnfläche × €/m²
- Kaufpreisfaktor
- Bauchgefühl
- Maklerpreis

Das führt insbesondere in Phasen steigender Zinsen und heterogener Grundstücksnutzungen zu systematischen Fehlbewertungen.

ImmoWert versucht stattdessen:

- Bodenwert logisch zu zerlegen
- Nutzbarkeit zu bewerten
- Marktparameter transparent zu machen
- Ertragswert normnah zu berechnen
- Datenerhebung direkt in den Workflow zu integrieren

---

# Aktuelle Module

## 1. Ertragswertverfahren

Aktuell implementiert:

- Jahresrohertrag
- Bewirtschaftungskosten
- Jahresreinertrag
- Bodenwertverzinsung
- Gebäudereinertrag
- Kapitalisierung / Vervielfältiger
- Gebäudeertragswert
- vorläufiger Ertragswert
- boG-Zuschläge / Abschläge
- finaler Ertragswert

Grundformel:

```text
Ertragswert = Gebäudeertragswert + Bodenwert ± boG
```

Gebäudeertragswert:

```text
Gebäudereinertrag × Kapitalisierungsfaktor
```

Gebäudereinertrag:

```text
Jahresreinertrag − Bodenwertverzinsung
```

Kapitalisierungsfaktor:

```text
V = (q^n − 1) / (q^n × p)
```

mit:

- q = 1 + p
- p = Liegenschaftszins
- n = Restnutzungsdauer

---

# 2. Restnutzungsdauer (RND)

## Ziel

Die RND soll möglichst gutachter- und marktberichtnah bestimmt werden.

Aktuell unterstützt:

### Tabellenverfahren ImmoWertA

- Gebäudealter
- Gesamtnutzungsdauer
- Modernisierungspunkte
- Lookup über Tabelle

Die aktuelle Implementierung enthält bereits Teile der ImmoWertA Anlage 2 Tabelle b für GND = 80 Jahre.

Die Tabelle reproduziert reale Gutachten deutlich besser als einfache lineare Näherungen.

### Formel-/Näherungsverfahren

Optional als Fallback:

```text
Rejuvenation = Tabellenalter × Punkte/20 × 0,55
```

Wird nur genutzt, wenn keine passende Tabelle hinterlegt ist.

---

# 3. Modernisierungspunktesystem

Das System orientiert sich an der ImmoWertA.

Aktuell berücksichtigt:

- Dach
- Fenster
- Leitungssysteme
- Heizung
- Fassadendämmung
- Bäder
- Innenausbau
- Grundrissverbesserung

Die Punkte beeinflussen die modifizierte Restnutzungsdauer.

---

# 4. Bodenwertlogik

## Ziel

Nicht jede Grundstücksfläche ist gleich viel wert.

Das Tool trennt daher:

- Bauland
- Garten-/Nebenfläche
- sonstige Flächen

und erlaubt unterschiedliche Wertansätze.

---

## Unterstützte Korrekturen

### BRW-Zeitfaktor

Historische BRW-Werte können eingetragen werden.

Daraus wird ein Trend abgeleitet.

Aktuell:

- lineare Fortschreibung
- optional
- ohne Historie Faktor = 1

---

### WGFZ-/Lagefaktor

Der Bodenrichtwert kann korrigiert werden bei:

- abweichender WGFZ
- anderer Nutzbarkeit
- Lageunterschieden
- atypischem Grundstück

---

### Teilflächenbewertung

Beispiel:

| Fläche | Ansatz |
|---|---|
| Bauland | 100 % |
| Gartenland | 10–40 % |
| PFG / Restfläche | reduziert |

Diese Methodik orientiert sich an:

- ImmoWertV
- Grundstücksmarktberichten
- gerichtlichen Gutachten
- Sachverständigenpraxis

---

# 5. Datenerhebung

Ein zentrales Merkmal des Projekts ist die Verbindung aus:

- Geometrie
- Datenerhebung
- Bewertung

Aktuell integriert:

- Linien messen
- Flächen messen
- Maßstab setzen
- PDF-/Bild-basierter Workflow

Geplante Erweiterungen:

- Polygon-Klassifizierung
- automatische Flächenübernahme
- Geoportal-/BORIS-Integration
- Baufensteranalyse
- Abstandsflächen

---

# 6. Sachwertverfahren (geplant)

Das Sachwertverfahren wird insbesondere relevant für:

- EFH
- ZFH
- eigengenutzte Immobilien

Geplant:

- NHK 2010
- BGF
- Baupreisindex
- Alterswertminderung
- Außenanlagen
- Sachwertfaktor
- Marktanpassung

---

# Architektur

## Frontend

Aktuell:

- HTML
- CSS
- Vanilla JavaScript

Bewusst ohne schweres Framework.

Ziel:

- maximale Transparenz
- einfache Erweiterbarkeit
- lokale Nutzbarkeit
- keine unnötige Komplexität

---

# Transparenzprinzip

Ein Kernziel des Projekts ist:

```text
Keine Blackbox-Bewertung.
```

Daher werden:

- Formeln
- Tabellen
- Herleitungen
- Annahmen
- Quellen
- Faktoren

möglichst transparent dargestellt.

Das Tool soll nachvollziehbar bleiben.

---

# Quellen / normative Grundlagen

Das Projekt orientiert sich unter anderem an:

- ImmoWertV
- ImmoWertA
- Grundstücksmarktbericht Stuttgart
- BORIS-BW
- Sachverständigenpraxis
- Verkehrswertgutachten

---

# Aktuelle Schwächen / offene Punkte

## RND

- Tabellen noch nicht vollständig hinterlegt
- aktuell primär GND 80
- Interpolation noch ausbaufähig

---

## Marktanpassung

Noch zu simpel.

Fehlen:

- Sachwertfaktoren
- regionale Anpassungen
- Teilmarktlogik

---

## boG

Aktuell nur saldierte Zuschläge/Abschläge.

Später sinnvoll:

- strukturiertes Mängelmodell
- CAPEX-Betrachtung
- Sanierungsstau
- Risikoaufschläge

---

## Datenmodell

Aktuell noch stark UI-orientiert.

Später sinnvoll:

```text
property
 ├── land
 ├── buildings
 ├── units
 ├── valuation
 ├── planningLaw
 └── measurements
```

---

# Geplante Erweiterungen

## Kurzfristig

- vollständige RND-Tabellen
- bessere Tooltip-Logik
- PDF-/Exposé-Import
- automatische Datenerkennung
- Ergebnisbericht

---

## Mittelfristig

- Sachwertverfahren
- Bebauungsplananalyse
- GFZ-/GRZ-Logik
- Nachverdichtungspotenzial
- Szenarien

---

## Langfristig

- halbautomatische Gutachtenunterstützung
- GIS-/Geoportal-Integration
- OCR + KI-Extraktion
- Energieberatung / GEG
- Entwicklungs- und Projektbewertung

---

# Grundannahme des Projekts

Der Marktwert einer Immobilie entsteht nicht allein aus:

```text
Wohnfläche × Marktpreis
```

sondern aus:

- Ertrag
- Nutzbarkeit
- Bodenpotenzial
- Marktparametern
- Planungsrecht
- Risiko
- Zustand
- Finanzierungskosten

ImmoWert versucht diese Faktoren transparent und nachvollziehbar abzubilden.
