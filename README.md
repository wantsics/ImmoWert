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

# Ertragswertverfahren

## Grundstruktur

Das Ertragswertverfahren basiert auf:

```text
Ertragswert = Gebäudeertragswert + Bodenwert ± boG
```

mit:

- boG = besondere objektspezifische Grundstücksmerkmale

---

# Jahresrohertrag

Der Jahresrohertrag ergibt sich aus:

```text
Σ(Mieteinheit)
```

Aktuell unterstützt:

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

für:

- Leerstand
- Teilnutzung
- Risiko
- temporäre Vermietung

---

# Bewirtschaftungskosten

Aktuell vereinfacht:

```text
Bewirtschaftungskosten = Jahresrohertrag × Kostenquote
```

Beispiel:

```text
37.212 € × 12,58 % = 4.682 €
```

Später geplant:

- Verwaltungskosten
- Instandhaltungskosten
- Mietausfallwagnis
- Betriebskostenstruktur
- objektspezifische Modelle

---

# Jahresreinertrag

```text
Jahresreinertrag = Jahresrohertrag − Bewirtschaftungskosten
```

---

# Bodenwert

## Grundidee

Nicht jede Grundstücksfläche besitzt denselben Wert.

Deshalb erfolgt eine Trennung in:

| Flächentyp | Typischer Ansatz |
|---|---|
| Bauland | 100 % |
| Gartenland | 10–40 % |
| PFG / Restflächen | reduziert |

---

# Bodenwertberechnung

Aktuell:

```text
angepasster BRW
= BRW × Zeitfaktor × Lage-/WGFZ-Faktor
```

anschließend:

```text
Bodenwert
= BRW_adj × Bauland
+ BRW_adj × Gartenfläche × Gartenfaktor
```

Beispiel:

```text
BRW = 1.500 €/m²
Zeitfaktor = 1,05
WGFZ-Faktor = 0,92

BRW_adj = 1.500 × 1,05 × 0,92
= 1.449 €/m²
```

---

# BRW-Zeitfaktor

Historische BRW-Werte können eingetragen werden.

Aktuell wird daraus eine lineare Fortschreibung erzeugt.

Beispiel:

| Jahr | BRW |
|---|---|
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

Der Bodenrichtwert beschreibt ein typisches Richtwertgrundstück.

Reale Grundstücke weichen häufig ab.

Typische Ursachen:

- andere GFZ
- andere WGFZ
- andere Nutzbarkeit
- schlechter Zuschnitt
- Topografie
- eingeschränkte Bebaubarkeit

Daher:

```text
BRW_adj = BRW × Lage-/WGFZ-Faktor
```

Beispiel:

```text
BRW = 1.500 €/m²
WGFZ-Faktor = 0,85

→ 1.275 €/m²
```

---

# Bodenwertverzinsung

Der Bodenwert wird im Ertragswertverfahren separat verzinst.

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

## Ziel

Die modifizierte Restnutzungsdauer soll möglichst gutachter- und marktberichtnah bestimmt werden.

---

# Gebäudealter

```text
Gebäudealter
= Bewertungsjahr − Baujahr
```

---

# Basis-RND

```text
Basis-RND
= GND − Gebäudealter
```

mit:

- GND = Gesamtnutzungsdauer

---

# Modernisierungspunktesystem

Das System orientiert sich an der ImmoWertA.

Aktuell:

| Gewerk | Max Punkte |
|---|---|
| Dach | 4 |
| Fenster | 2 |
| Leitungen | 2 |
| Heizung | 2 |
| Fassade | 4 |
| Bäder | 2 |
| Innenausbau | 2 |
| Grundriss | 2 |

Maximal:

```text
20 Punkte
```

---

# Tabellenverfahren ImmoWertA

Aktuell bevorzugtes Verfahren.

Verwendet:

```text
Gebäudealter
+ GND
+ Modernisierungspunkte
```

→ Lookup aus ImmoWertA Tabelle.

Beispiel:

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

ImmoWertA Tabelle b:

```text
Alter 80
Punkte 5
→ RND 24 Jahre
```

---

# Formel-/Näherungsverfahren

Optionaler Fallback.

Aktuell:

```text
Rejuvenation
= Tabellenalter × Punkte/20 × 0,55
```

anschließend:

```text
RND
= Basis-RND + Rejuvenation
```

Dieses Verfahren dient nur als Approximation.

Das Tabellenverfahren besitzt Vorrang.

---

# Kapitalisierung / Vervielfältiger

Der Kapitalisierungsfaktor wird aktuell berechnet über:

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

# boG

Aktuell vereinfacht:

```text
Ertragswert_final
= vorläufiger Ertragswert
+ Zuschläge
− Abschläge
```

Später geplant:

- CAPEX
- Mängelmodell
- Risikoaufschläge
- Sanierungsstau
- energetische Risiken

---

# Datenerhebung

Ein zentrales Merkmal des Projekts ist die Kombination aus:

- Geometrie
- Datenerhebung
- Bewertung

Aktuell:

- Linien messen
- Flächen messen
- Maßstab setzen
- PDF-/Bild-Workflow

Ziel:

```text
Geometrie → direkt in Bewertung
```

---

# Architektur

Aktuell bewusst simpel:

- HTML
- CSS
- Vanilla JavaScript

Keine Framework-Abhängigkeit.

Ziele:

- Transparenz
- einfache Erweiterbarkeit
- lokale Nutzbarkeit
- niedrige Komplexität

---

# Transparenzprinzip

Das Tool soll keine Blackbox sein.

Deshalb werden:

- Formeln
- Tabellen
- Rechenschritte
- Annahmen
- Faktoren
- Herleitungen
- Quellen

offengelegt.

Ziel:

```text
Jeder Wert soll mathematisch nachvollziehbar sein.
```

---

# Geplante Erweiterungen

## Kurzfristig

- vollständige ImmoWertA-Tabellen
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
- Grundstücksmarktberichten
- BORIS-BW
- Verkehrswertgutachten
- Sachverständigenpraxis
