# ImmoWert

**Branch:** `refactor/bodenwert-workflow`  
**Stand:** `LAB7784 Immowert V0.2.16`  
**Ziel:** wissenschaftlich nachvollziehbare, marktberichtnahe Immobilienbewertung mit transparenter Bodenwert-, Ertragswert- und Marktprofil-Logik.

---

## 1. Zweck und Leitprinzip

ImmoWert ist kein einfacher Kaufpreisrechner. Das Tool soll eine Bewertung so darstellen, dass ein Nutzer oder ein weiterentwickelnder Agent jeden wesentlichen Wert auf Eingaben, Marktparameter, Tabellen und Formeln zurückführen kann.

Leitprinzip:

```text
Eingabe → Marktprofil → Korrekturmodell → Zwischenwert → Ergebnis → Herleitung
```

Die Anwendung ist aktuell als MVP umgesetzt. Einige UI-Module sind als Overlay über die ursprüngliche HTML-Struktur gelegt. Fachlich ist der Workflow bereits profilgesteuert; technisch sollte die Logik mittelfristig in zentrale Rechenkerne konsolidiert werden.

---

## 2. Workflow

### 2.1 Marktprofil

Das Marktprofil steuert lokale Marktlogik aus Grundstücksmarktberichten:

- Gutachterausschuss
- Berichtsjahr und Stichtage
- Bodenwertmodell
- verfügbare Korrekturen
- Liegenschaftszinssätze
- Hinweise zur Datenqualität

Die Anwendung soll nicht nach Städten hardcodieren, sondern aus dem aktiven Profil ableiten, welche Eingaben, Korrekturen und Tabellen verfügbar sind.

### 2.2 Objekt

Objektdaten stammen typischerweise aus Exposé, Besichtigung, Grundbuch, Planunterlagen und Bebauungsplan:

- Objektname
- Adresse
- Erfassungsdatum
- Baujahr
- Wohn-/Nutzfläche
- Einheiten

Das **Erfassungsdatum** ist vom **rechenrelevanten Bewertungsstichtag** getrennt.

### 2.3 Grundstück / Flächen

Diese Felder liegen im Objektbereich, weil sie Stammdaten des Grundstücks sind:

- Grundstücksfläche
- wertrelevante Geschossfläche
- tatsächliche WGFZ
- Baulandfläche
- Garten-/Nebenfläche
- Gartenfaktor

### 2.4 Bodenrichtwert und Bodenwert

Bodenrichtwertdaten stammen aus BORIS, Bodenrichtwertkarte oder Marktbericht.

Mindesteingabe:

```text
BRW-Jahr
BRW in €/m²
```

Optional:

```text
historische BRW-Werte
rechenrelevanter Stichtag
```

Der Bodenwertbereich zeigt Korrekturen und Ergebniswerte:

- automatischer BRW
- manueller Faktor
- WGFZ-Faktor
- Referenzflächenfaktor
- beitragsfreier Bodenwert je m²
- gewichtete Fläche
- Bodenwert gesamt

---

## 3. Bodenrichtwertlogik

### 3.1 Begriffe

| Begriff | Bedeutung |
|---|---|
| erfasster BRW | Eingabewert aus BORIS / Marktbericht mit Jahr |
| automatischer BRW | BRW nach Stichtagskorrektur; Anzeige- und Rechenwert |
| Stichtagsfaktor | automatischer BRW / erfasster BRW |
| beitragsfreier Bodenwert €/m² | automatischer BRW × weitere Korrekturfaktoren |

Wichtig:

```text
Der automatische BRW ist kein Eingabewert.
Er ist die Anzeige des korrigierten BRW nach Stichtagslogik.
```

### 3.2 Ein BRW-Wert

Wenn nur eine vollständige BRW-Zeile vorhanden ist:

```text
Jahr = 2025
BRW = 1.000 €/m²
```

Dann gilt:

```text
automatischer BRW = 1.000 €/m²
Stichtagsfaktor = 1,000
```

### 3.3 Mindestens zwei BRW-Werte

Bei einem zusätzlichen historischen BRW wird linear auf den Bewertungsstichtag fortgeschrieben.

Definitionen:

```text
inputYear      = Jahr des erfassten BRW
inputBRW       = erfasster BRW
referenceYear  = Jahr des historischen BRW
referenceBRW   = historischer BRW
valuationDate  = rechenrelevanter Stichtag
```

Jährliche Änderung:

```text
annualDelta = (inputBRW − referenceBRW) / (inputYear − referenceYear)
```

Zeitanteil:

```text
dayFraction = Tage(01.01.inputYear bis valuationDate) / 365
```

Automatischer BRW:

```text
automaticBRW = inputBRW + annualDelta × dayFraction
```

Stichtagsfaktor:

```text
timeFactor = automaticBRW / inputBRW
```

Wenn keine auswertbare Historie vorliegt:

```text
automaticBRW = inputBRW
timeFactor = 1,000
```

Fachliche Einordnung: Die lineare Fortschreibung ist eine MVP-Näherung. Wenn ein Marktbericht eine eigene Index- oder Stichtagsmethode vorgibt, sollte diese künftig im Marktprofil modelliert werden.

---

## 4. Bodenwertformeln

### 4.1 Korrekturfaktoren

Nach der Stichtagskorrektur wirken weitere Faktoren:

```text
correctionFactor = manualFactor × wgfzFactor × referenceAreaFactor
```

Default:

```text
manualFactor = 1,000
wgfzFactor = 1,000
referenceAreaFactor = 1,000
```

Nicht verfügbare oder deaktivierte Korrekturmodelle bleiben neutral bei `1,000`.

### 4.2 Angepasster Bodenrichtwert

```text
adjustedBRW = automaticBRW × correctionFactor
```

### 4.3 Gewichtete Fläche

```text
weightedArea = buildingLandArea + gardenArea × gardenFactor
```

### 4.4 Bodenwert

```text
landValue = adjustedBRW × weightedArea
```

Ausgeschrieben:

```text
landValue = automaticBRW × manualFactor × wgfzFactor × referenceAreaFactor
            × (buildingLandArea + gardenArea × gardenFactor)
```

---

## 5. WGFZ-Korrektur

Die WGFZ-Korrektur wird nur aktiviert, wenn das aktive Marktprofil ein WGFZ-Modell enthält.

Tatsächliche Objekt-WGFZ:

```text
actualWgfz = relevantFloorArea / plotArea
```

Tabellenstruktur:

```json
[WGFZ, Umrechnungskoeffizient]
```

Lineare Interpolation:

```text
UK(x) = y1 + (y2 − y1) × (x − x1) / (x2 − x1)
```

WGFZ-Faktor:

```text
wgfzFactor = UK(actualWgfz) / UK(referenceWgfz)
```

Verhalten:

| Fall | Ergebnis |
|---|---|
| Profil unterstützt WGFZ | Checkbox aktiv, Faktor berechnet |
| Profil unterstützt WGFZ, Checkbox aus | Faktor 1,000 |
| Profil unterstützt keine WGFZ | Felder deaktiviert, Faktor 1,000 |
| Wert außerhalb Tabelle ohne Extrapolation | Warnung, keine stille Kappung |
| Wert außerhalb Tabelle mit Extrapolation | lineare Extrapolation mit Warnung |

---

## 6. Referenzflächenkorrektur

Ein Marktprofil kann Flächenfaktoren enthalten. Aktuelle unterstützte Tabelle:

```json
[minArea, maxArea, factor]
```

Beispiel:

```json
[400, 499, 0.963]
```

bedeutet:

```text
400 m² bis 499 m² → Faktor 0,963
```

Offenes Intervall:

```json
[800, null, 1.110]
```

bedeutet:

```text
ab 800 m² → Faktor 1,110
```

Auswertung:

```text
referenceAreaFactor = Tabellenfaktor(plotArea)
```

Wenn keine Tabelle verfügbar ist oder keine Zeile passt:

```text
referenceAreaFactor = 1,000
```

Aktueller Sonderfall: Im Reutlingen-Profil liegt die Tabelle unter `comparisonValue.efhZfhPlotSizeFactor`. Das MVP erkennt sie als Referenzflächenkorrektur. Langfristig sollte sie explizit unter `landValue.corrections` modelliert werden.

---

## 7. Manueller Lage-/Objektfaktor

```text
manualFactor = Eingabe, default 1,000
```

Der Faktor dient sachverständigen Anpassungen, wenn ein Marktbericht keine eigene Tabelle bereitstellt oder objektbezogene Besonderheiten nicht durch WGFZ bzw. Referenzfläche abgebildet sind.

Keine Doppelkorrektur: Wenn eine Eigenschaft bereits durch WGFZ oder Referenzfläche korrigiert ist, darf sie nicht nochmals manuell korrigiert werden.

---

## 8. Ertragswertverfahren

### 8.1 Jahresrohertrag

Je Einheit gibt es zwei Mietmodi.

Variante €/m²:

```text
annualIncomeUnit = area × rentPerSqm × 12 × factor
```

Variante Monatsmiete:

```text
annualIncomeUnit = monthlyRent × 12 × factor
```

Gesamt:

```text
grossIncome = Σ annualIncomeUnit
```

### 8.2 Bewirtschaftungskosten

```text
operatingCosts = grossIncome × operatingCostRate / 100
```

### 8.3 Jahresreinertrag

```text
netIncome = grossIncome − operatingCosts
```

### 8.4 Bodenwertverzinsung

```text
landInterest = landValue × propertyYield / 100
```

### 8.5 Gebäudereinertrag

```text
buildingIncome = netIncome − landInterest
```

### 8.6 Kapitalisierungsfaktor

```text
p = propertyYield / 100
q = 1 + p
n = remainingLife
```

```text
capitalizationFactor = (q^n − 1) / (q^n × p)
```

Sonderfälle:

```text
n ≤ 0 → Faktor = 0
p ≤ 0 → Faktor = n
```

### 8.7 Gebäudeertragswert

```text
buildingValue = buildingIncome × capitalizationFactor
```

### 8.8 Vorläufiger Ertragswert

```text
preliminaryIncomeValue = buildingValue + landValue
```

### 8.9 Marktanpassung und boG

```text
marketAdjustedValue = preliminaryIncomeValue × (1 + marketAdjustment / 100)
```

```text
bogTotal = bogAdditions − bogDeductions
```

```text
incomeValue = marketAdjustedValue + bogTotal
```

### 8.10 Ankaufsauswertung

```text
targetOffer = incomeValue × (1 − negotiationBuffer / 100)
```

```text
totalAcquisitionCost = purchasePrice × (1 + purchaseCostsRate / 100)
```

```text
valueGap = incomeValue − totalAcquisitionCost
```

```text
rentMultiplier = purchasePrice / grossIncome
```

```text
grossYield = grossIncome / purchasePrice × 100
netYield = netIncome / purchasePrice × 100
```

---

## 9. Restnutzungsdauer und Modernisierung

Gebäudealter:

```text
buildingAge = valuationYear − constructionYear
```

Basis-RND:

```text
baseRND = max(0, totalUsefulLife − buildingAge)
```

Modernisierungspunkte:

| Gewerk | Max. Punkte |
|---|---:|
| Dach | 4 |
| Fenster und Außentüren | 2 |
| Leitungssysteme | 2 |
| Heizung | 2 |
| Außenwanddämmung | 4 |
| Bäder | 2 |
| Innenausbau | 2 |
| Grundrissverbesserung | 2 |

Summe:

```text
modernizationPoints = 0 … 20
```

Aktuelle MVP-Näherung:

```text
tableAge = min(buildingAge, totalUsefulLife)
rejuvenation = tableAge × modernizationPoints / 20 × 0,55
modifiedRND = round(min(totalUsefulLife, max(baseRND, baseRND + rejuvenation)))
```

Fachlicher Zielzustand:

```text
Gebäudealter + GND + Modernisierungspunkte → Tabellenwert nach ImmoWertA Anlage 2
```

Die aktuelle RND ist daher als Näherung zu verstehen.

---

## 10. Liegenschaftszinsen

Die Liegenschaftszinsen stammen aus dem aktiven Marktprofil:

```json
"yields": [
  { "id": "mfh", "label": "Reines Mehrfamilienhaus", "yieldPercent": 1.5 }
]
```

Die UI rendert daraus im Abschnitt `Modellparameter` eine kompakte Radioliste:

```text
Reines Mehrfamilienhaus        1,5 %   ○
MFH Gewerbeanteil ≤ 20 %       1,4 %   ○
```

Die Auswahl setzt:

```text
propertyYield
propertyYieldNote
```

Der alte statische Stuttgart-Block ist ausgeblendet, weil das Profilmodell generisch sein soll.

---

## 11. JSON-Marktprofilstruktur

Datei:

```text
market-profiles.json
```

### 11.1 Top-Level

```json
{
  "id": "stuttgart-2024",
  "name": "Stuttgart",
  "committee": "Gutachterausschuss Stuttgart",
  "reportYear": 2024,
  "dataStichtag": "2024-01-01",
  "source": "Grundstücksmarktbericht Stuttgart 2024",
  "landValue": {},
  "yields": []
}
```

### 11.2 Wichtige Felder

| Feld | Bedeutung |
|---|---|
| `id` | stabile technische Profil-ID |
| `name` | Anzeigename |
| `committee` | Gutachterausschuss |
| `reportYear` | Berichtsjahr |
| `marketPeriod` | Marktperiode |
| `dataStichtag` | Datenstichtag |
| `brwStichtag` | Bodenrichtwertstichtag |
| `source` | Quellenangabe |
| `profileQuality` | Qualität / Einschränkung |
| `landValue` | Bodenwertmodell |
| `yields` | Liegenschaftszinssätze |
| `assetValue` | Sachwertdaten, soweit vorhanden |
| `comparisonValue` | Vergleichswertfaktoren, soweit vorhanden |
| `marketEvidence` | zusätzliche Marktdaten |

### 11.3 `landValue`

```json
"landValue": {
  "model": "wgfz",
  "requiredInputs": ["baseLandValuePerSqm", "plotArea"],
  "optionalInputs": ["gardenArea", "gardenFactor", "manualLocationFactor"],
  "disabledInputs": ["wgfzSoll", "wgfzCorrectionFactor"],
  "formula": "textuelle Formelbeschreibung",
  "tables": {},
  "interpolation": "linear",
  "notes": []
}
```

Bedeutung:

| Feld | Zweck |
|---|---|
| `model` | Modelltyp des Marktberichts |
| `requiredInputs` | zwingend benötigte UI-Felder |
| `optionalInputs` | optionale UI-Felder |
| `disabledInputs` | nicht passende UI-Felder |
| `formula` | dokumentierte Marktberichtslogik |
| `tables` | Umrechnungskoeffizienten |
| `interpolation` | Interpolationsart |
| `notes` | fachliche Hinweise |

### 11.4 Empfohlene Zielstruktur `landValue.corrections`

Für neue Profile soll die Korrekturlogik expliziter werden:

```json
"landValue": {
  "model": "profile_based_corrections",
  "requiredInputs": ["baseLandValuePerSqm", "plotArea", "buildingLandArea"],
  "optionalInputs": ["gardenArea", "gardenFactor", "manualLocationFactor"],
  "corrections": [
    {
      "id": "manual",
      "type": "manual_factor",
      "label": "Manueller Lage-/Objektfaktor",
      "enabled": true,
      "defaultFactor": 1.0
    },
    {
      "id": "wgfz",
      "type": "table_interpolation",
      "label": "WGFZ-Korrektur",
      "enabled": true,
      "inputReference": "wgfzSoll",
      "inputTarget": "actualWgfz",
      "formula": "UK(target) / UK(reference)",
      "defaultFactor": 1.0
    },
    {
      "id": "reference_area",
      "type": "range_table_factor",
      "label": "Referenzflächenkorrektur",
      "enabled": true,
      "input": "plotArea",
      "table": [[170, 399, 0.926], [400, 499, 0.963]],
      "defaultFactor": 1.0
    }
  ]
}
```

Ziel:

```text
UI und Rechenkern interpretieren Korrekturen generisch aus dem Profil.
Keine Stadtlogik hardcodieren.
```

---

## 12. Aktuelle Profile

### 12.1 Stuttgart 2024

- Modell: `wgfz`
- WGFZ-Korrektur aktiv
- Tabellen: `lowrise`, `multi`
- lineare Interpolation
- Liegenschaftszinsen für MFH, gemischt genutzt, Geschäftshaus, Büro

Formel laut Profil:

```text
BRW_adj = BRW × Zeitfaktor × UK(WGFZ_ist) / UK(WGFZ_soll) × sonstiger Faktor
```

### 12.2 Reutlingen 2025

- Modell: `reutlingen_no_wgfz_individual_housing`
- WGFZ im individuellen Wohnungsbau deaktiviert
- sachverständiger Faktor möglich
- Garten-/Mehrflächen mit reduzierten Faktoren prüfen
- Grundstücksgrößenfaktoren unter `comparisonValue.efhZfhPlotSizeFactor`

Aktuelle MVP-Entscheidung:

```text
comparisonValue.efhZfhPlotSizeFactor wird als Referenzflächenkorrektur ausgewertet.
```

Langfristig sollte das explizit nach `landValue.corrections` migriert werden.

### 12.3 Fellbach 2022

- Modell: `brw_manual_no_local_adjustment_tables`
- keine lokalen WGFZ- oder Grundstücksgrößen-Umrechnungskoeffizienten
- WGFZ deaktiviert
- Referenzflächenfaktor neutral 1,000
- manueller Faktor möglich
- Liegenschaftszinsen nur als Fallback / sachverständig anzupassen

---

## 13. Implementierungsübersicht

| Datei | Aufgabe |
|---|---|
| `index.html` | statische Grundstruktur |
| `style.css` | Basislayout |
| `app.js` | Hauptzustand, Einheiten, RND, Ertragswert, Tooltips, boG |
| `ribbon.js` | Marktprofil-UI, Profilimport/-export, Profilauswahl |
| `market-profiles.json` | lokale Marktlogik und Zinssätze |
| `src/calc/wgfz.js` | WGFZ-Funktionen und Import-Hub für UI-Module |
| `src/ui/workflow.js` | Workflow-Umbau der UI |
| `src/ui/brw-model.js` | automatischer BRW und Stichtagslogik |
| `src/ui/date-model.js` | Erfassungsdatum vs. Bewertungsstichtag |
| `src/ui/generic-land-model.js` | profilbasierte Bodenwertkorrekturen |
| `src/ui/object-area-model.js` | Grundstücks-/Flächenblock im Objekt |
| `src/ui/yield-radio-model.js` | Liegenschaftszins-Radioliste aus Profil |
| `src/ui/app-version.js` | zentrale sichtbare Version |

Aktuelle technische Realität:

```text
app.js enthält ursprüngliche Rechenlogik.
generic-land-model.js korrigiert profilabhängig Ergebniswerte.
Mehrere UI-Module verschieben DOM-Elemente nachträglich.
```

Zielarchitektur:

```text
Profilmodell → zentraler Rechenkern → Ergebnisobjekt → UI-Rendering
```

---

## 14. Bekannte technische Schulden

1. **Doppelte Bodenwertlogik**  
   `app.js` und `generic-land-model.js` berechnen bzw. überschreiben Teile des Bodenwerts. Ziel ist eine zentrale `calculateLandValue()`-Funktion.

2. **Overlay-UI**  
   Mehrere Module ändern nachträglich die DOM-Struktur. Das sollte mittelfristig in `index.html` und eine saubere Renderlogik überführt werden.

3. **Versionskonstanten**  
   Ältere Module enthalten noch eigene Versionskonstanten. Sichtbar stabilisiert wird die Version durch `src/ui/app-version.js`.

4. **RND-Näherung**  
   Die Restnutzungsdauer ist derzeit eine Näherung, noch kein vollständiger ImmoWertA-Tabellenlookup.

5. **Reutlingen Referenzfläche**  
   Der aktuell verwendete Faktor liegt unter `comparisonValue`; fachlich sauberer wäre eine explizite `landValue.corrections`-Definition.

---

## 15. Regressionstests

### Stuttgart

```text
Profil Stuttgart
BRW 1.000 €/m²
WGFZ_Richtwert 1,0
Grundstück 500 m²
wertrelevante Geschossfläche 250 m²
```

Erwartung:

```text
actualWgfz = 0,5
wgfzFactor = UK(0,5) / UK(1,0)
Checkbox an/aus verändert Bodenwert
```

### Reutlingen

```text
Profil Reutlingen
plotArea = 450 m²
```

Erwartung:

```text
WGFZ deaktiviert
referenceAreaFactor = 0,963
Bodenwert verändert sich über Referenzfläche
```

### Fellbach

```text
Profil Fellbach
```

Erwartung:

```text
WGFZ deaktiviert
referenceAreaFactor = 1,000
nur manueller Faktor wirkt
```

### BRW

```text
1 BRW-Zeile → automaticBRW = inputBRW, timeFactor = 1,000
2 BRW-Zeilen → automaticBRW wird linear fortgeschrieben
```

### Liegenschaftszins

```text
Radiobutton setzt propertyYield und propertyYieldNote
alter statischer Stuttgart-Zinsblock ist nicht sichtbar
```

### Version

```text
sichtbare Version bleibt stabil auf LAB7784 Immowert V0.2.16
```

---

## 16. Entwicklungsregeln für neue Agenten

1. Keine Stadtlogik hardcodieren.

```js
// falsch
if (profile.id === 'reutlingen-2025') { ... }

// richtig
if (profile.landValue.corrections contains 'reference_area') { ... }
```

2. Nicht verfügbare Korrekturen bleiben neutral.

```text
Faktor = 1,000
```

3. Keine stille Kappung von Tabellenwerten.  
   Entweder Warnung oder explizite Extrapolation.

4. Rechenlogik nicht weiter aus DOM-Feldern zusammenstückeln.  
   Ziel ist ein Ergebnisobjekt:

```js
{
  inputBrw,
  automaticBrw,
  timeFactor,
  manualFactor,
  wgfzFactor,
  referenceAreaFactor,
  correctionFactor,
  adjustedBrw,
  weightedArea,
  landValue,
  explanations
}
```

5. Jede fachliche Änderung muss README und Testfälle aktualisieren.

---

## 17. Lokale Entwicklung

```powershell
git checkout refactor/bodenwert-workflow
git pull origin refactor/bodenwert-workflow
npm install
npm run format
```

Start z. B. über einen statischen Server:

```powershell
npx serve .
```

Wichtig: Marktprofile können im Browser-Local-Storage überschrieben sein. Bei unerwartetem Verhalten im Service-Menü `Defaults wiederherstellen` nutzen.
