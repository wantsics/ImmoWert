# ImmoWert

## Zielsetzung

ImmoWert ist ein transparentes Bewertungs- und Analysewerkzeug für Immobilien.

Ziel ist nicht ein vereinfachter Online-Rechner, sondern ein nachvollziehbares Werkzeug mit:

- transparenter Rechenlogik
- nachvollziehbaren Parametern
- marktberichtnahen Verfahren
- gutachterähnlicher Struktur
- integrierter Datenerhebung

Der Nutzer soll jederzeit nachvollziehen können:

```text
Welche Annahme führt mathematisch zu welchem Wert?
```

---

# Grundidee

Viele Marktteilnehmer bewerten Immobilien vereinfacht über:

```text
Wohnfläche × Marktpreis
```

oder:

```text
Kaufpreis / Jahresmiete
```

Diese Verfahren ignorieren häufig:

- Bodenwertpotenzial
- Teilflächen
- WGFZ
- Marktanpassungen
- Restnutzungsdauer
- Modernisierung
- Finanzierungskosten
- Planungsrecht

ImmoWert versucht stattdessen:

- reale Nutzbarkeit zu modellieren
- Grundstücke differenziert zu bewerten
- Ertragswerte normnah zu berechnen
- sämtliche Rechenschritte transparent offenzulegen

---

# Transparenzprinzip

Das Tool soll keine Blackbox sein.

Offengelegt werden:

- Formeln
- Tabellen
- Rechenschritte
- Zwischenwerte
- Annahmen
- Faktoren
- Herleitungen
- Quellen
- Einzelpositionen

Ziel:

```text
Jeder Ergebniswert soll mathematisch nachvollziehbar sein.
```

---

# Ergebnis-Tooltips / Explainable Valuation

Ein zentrales Konzept des Projekts ist:

```text
Explainable Valuation
```

Jeder wesentliche Ergebniswert besitzt eine dynamische Erklärung.

Beispiel:

```text
Gebäudereinertrag
=
Jahresreinertrag − Bodenwertverzinsung

32.524 €
− 13.890 €
=
18.634 €
```

Die Tooltips werden live aus den aktuellen Eingabewerten generiert.

Aktuell erklärt:

- angepasster Bodenrichtwert
- Bodenwert
- Jahresrohertrag
- Bewirtschaftungskosten
- Jahresreinertrag
- Bodenwertverzinsung
- Gebäudereinertrag
- Vervielfältiger
- Gebäudeertragswert
- vorläufiger Ertragswert
- boG-Saldo
- finaler Ertragswert
- Renditen
- Kaufpreisfaktor
- Ziel-Angebot

---

# Ertragswertverfahren

## Grundstruktur

```text
Ertragswert = Gebäudeertragswert + Bodenwert ± boG
```

mit:

```text
boG = besondere objektspezifische Grundstücksmerkmale
```

---

# Jahresrohertrag

```text
Σ(Mieteinheit)
```

## Variante A

```text
Wohnfläche × €/m² × 12
```

## Variante B

```text
Monatsmiete × 12
```

Optional:

```text
Faktor × Jahresmiete
```

---

# Bewirtschaftungskosten

```text
Bewirtschaftungskosten = Jahresrohertrag × Kostenquote
```

Beispiel:

```text
37.212 € × 12,58 % = 4.682 €
```

---

# Jahresreinertrag

```text
Jahresreinertrag = Jahresrohertrag − Bewirtschaftungskosten
```

---

# Bodenwert

## Angepasster Bodenrichtwert

```text
BRW_adj = BRW × Zeitfaktor × Lage-/WGFZ-Faktor
```

---

## Bodenwert

```text
Bodenwert
= BRW_adj × Bauland
+ BRW_adj × Gartenfläche × Gartenfaktor
```

---

# BRW-Zeitfaktor

## Historische Fortschreibung

Beispiel:

| Jahr | BRW        |
| ---- | ---------- |
| 2020 | 1.100 €/m² |
| 2024 | 1.500 €/m² |

Gradient:

```text
(1500 − 1100) / 4
= 100 €/m² pro Jahr
```

Zieljahr 2026:

```text
1.500 + 2 × 100
= 1.700 €/m²
```

Zeitfaktor:

```text
1.700 / 1.500 = 1,133
```

---

# WGFZ-/Lagefaktor

```text
BRW_adj = BRW × Lage-/WGFZ-Faktor
```

Beispiel:

```text
1.500 €/m² × 0,85
= 1.275 €/m²
```

---

# Bodenwertverzinsung

```text
Bodenwertverzinsung = Bodenwert × Liegenschaftszins
```

Beispiel:

```text
926.000 € × 1,5 %
= 13.890 €
```

---

# Gebäudereinertrag

```text
Gebäudereinertrag
= Jahresreinertrag − Bodenwertverzinsung
```

Beispiel:

```text
32.524 € − 13.890 €
= 18.634 €
```

---

# Restnutzungsdauer (RND)

## Gebäudealter

```text
Gebäudealter = Bewertungsjahr − Baujahr
```

---

## Basis-RND

```text
Basis-RND = GND − Gebäudealter
```

---

# Modernisierungspunktesystem

| Gewerk      | Max Punkte |
| ----------- | ---------- |
| Dach        | 4          |
| Fenster     | 2          |
| Leitungen   | 2          |
| Heizung     | 2          |
| Fassade     | 4          |
| Bäder       | 2          |
| Innenausbau | 2          |
| Grundriss   | 2          |

---

# ImmoWertA Tabellenverfahren

## Prinzip

```text
Gebäudealter
+ GND
+ Modernisierungspunkte
→ Tabellenwert
```

---

# RND-Tabelle (Auszug GND = 80)

| Alter | P0  | P1  | P2  | P3  | P4  | P5  | P6  | P7  | P8  | P9  | P10 |
| ----- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 68    | 16  | 16  | 19  | 21  | 24  | 27  | 29  | 32  | 34  | 36  | 39  |
| 70    | 15  | 15  | 18  | 21  | 23  | 26  | 29  | 31  | 34  | 36  | 38  |
| 72    | 14  | 14  | 17  | 20  | 23  | 25  | 28  | 31  | 33  | 36  | 38  |
| 74    | 13  | 13  | 16  | 19  | 22  | 25  | 28  | 30  | 33  | 35  | 37  |
| 76    | 13  | 13  | 16  | 19  | 22  | 25  | 27  | 30  | 33  | 35  | 37  |
| 78    | 12  | 12  | 15  | 18  | 22  | 24  | 27  | 30  | 32  | 35  | 37  |
| 80    | 12  | 12  | 15  | 18  | 21  | 24  | 27  | 29  | 32  | 34  | 37  |

---

## Beispiel

```text
Baujahr = 1937
Bewertungsjahr = 2024
Alter = 87 Jahre
GND = 80 Jahre
Modernisierung = 5 Punkte
```

Tabellenalter:

```text
min(87,80) = 80
```

Tabellenlookup:

```text
Alter 80
Punkte 5
→ RND 24 Jahre
```

---

# Formel-/Näherungsverfahren

```text
Rejuvenation
= Tabellenalter × Punkte/20 × 0,55
```

anschließend:

```text
RND = Basis-RND + Rejuvenation
```

---

# Kapitalisierung / Vervielfältiger

## Formel

```text
V = (q^n − 1) / (q^n × p)
```

mit:

```text
q = 1 + p
```

und:

- p = Liegenschaftszins
- n = Restnutzungsdauer

---

# Kapitalisierungsfaktor-Tabelle (Auszug)

| RND | 1,0 % | 1,5 % | 2,0 % | 2,5 % | 3,0 % |
| --- | ----- | ----- | ----- | ----- | ----- |
| 10  | 9,47  | 9,14  | 8,98  | 8,75  | 8,53  |
| 15  | 13,99 | 13,04 | 12,85 | 12,43 | 11,94 |
| 20  | 18,05 | 16,92 | 16,35 | 15,59 | 14,88 |
| 24  | 21,26 | 20,03 | 18,94 | 18,04 | 17,07 |
| 30  | 25,81 | 23,93 | 22,40 | 21,00 | 19,60 |
| 40  | 33,05 | 29,84 | 27,36 | 25,02 | 22,80 |
| 50  | 39,20 | 34,85 | 31,42 | 28,37 | 25,73 |

---

# Gebäudeertragswert

```text
Gebäudeertragswert
= Gebäudereinertrag × Kapitalisierungsfaktor
```

---

# Vorläufiger Ertragswert

```text
vorläufiger Ertragswert
= Gebäudeertragswert + Bodenwert
```

---

# boG – besondere objektspezifische Grundstücksmerkmale

boG beschreibt wertrelevante Eigenschaften eines Grundstücks oder Gebäudes, die nicht bereits in:

- Bodenwert
- Ertragswertmodell
- Marktparametern
- Standardannahmen

enthalten sind.

boG wird typischerweise erst am Ende der Wertermittlung berücksichtigt.

---

# Strukturierte boG-Erfassung

boG wird nicht mehr nur als Gesamtwert erfasst.

Stattdessen werden Einzelpositionen modelliert:

| Typ      |     Betrag | Kommentar           |
| -------- | ---------: | ------------------- |
| Abschlag |  −80.000 € | Sanierungsstau Dach |
| Abschlag |  −25.000 € | Feuchtigkeit Keller |
| Zuschlag |  +60.000 € | Ausbaureserve DG    |
| Zuschlag | +100.000 € | Nachverdichtung     |

Der Saldo ergibt sich aus:

```text
boG = Summe Zuschläge − Summe Abschläge
```

---

# Typische boG-Abschläge

| Merkmal                  | Wirkung  |
| ------------------------ | -------- |
| Sanierungsstau           | Abschlag |
| Feuchtigkeit / Schäden   | Abschlag |
| Altlasten                | Abschlag |
| schlechte Vermietbarkeit | Abschlag |
| Denkmalschutzauflagen    | Abschlag |
| fehlende Stellplätze     | Abschlag |
| CAPEX-Risiken            | Abschlag |

---

# Typische boG-Zuschläge

| Merkmal                   | Wirkung  |
| ------------------------- | -------- |
| Nachverdichtungspotenzial | Zuschlag |
| Ausbaureserve             | Zuschlag |
| genehmigte Erweiterung    | Zuschlag |
| Sondernutzung             | Zuschlag |
| Mietsteigerungspotenzial  | Zuschlag |

---

# Aktuelle Implementierung

```text
Ertragswert_final
= vorläufiger Ertragswert
+ Marktanpassung
+ boG
```

Der boG-Saldo wird automatisch aus allen Einzelpositionen berechnet.

Die Ergebnis-Tooltips listen zusätzlich:

- Zuschläge
- Abschläge
- Kommentare
- Saldo

transparent auf.

---

# Datenerhebung

## Ziel

```text
Geometrie → direkt in Bewertung
```

Aktuell:

- Linien messen
- Flächen messen
- Maßstab setzen
- PDF-/Bild-Workflow

---

# Architektur

Aktuell bewusst simpel:

- HTML
- CSS
- Vanilla JavaScript

Keine Framework-Abhängigkeit.

Ziele:

- maximale Transparenz
- einfache Erweiterbarkeit
- lokale Nutzbarkeit
- geringe technische Komplexität

---

# Geplante Erweiterungen

## Kurzfristig

- vollständige ImmoWertA-Tabellen
- vollständige Kapitalisierungstabellen
- Interpolation
- Sachwertverfahren
- NHK 2010
- PDF-/Exposé-Import
- OCR
- Ergebnisbericht

---

## Mittelfristig

- GFZ-/GRZ-Analyse
- Bebauungsplanlogik
- Nachverdichtungspotenzial
- Szenarien
- Sachwertfaktoren
- Marktmodelle

---

## Langfristig

- GIS-/Geoportal-Integration
- BORIS-Schnittstellen
- KI-gestützte Datenerkennung
- halbautomatische Gutachtenunterstützung
- Energieberatung / GEG
- Projektentwicklung

---

# Quellen / Grundlagen

Das Projekt orientiert sich unter anderem an:

- ImmoWertV
- ImmoWertA
- Grundstücksmarktberichte
- BORIS-BW
- Verkehrswertgutachten
- Sachverständigenpraxis
