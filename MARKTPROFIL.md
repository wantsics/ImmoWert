# Marktprofil-Extraktion aus Grundstücksmarktberichten

## Zweck

Diese Datei beschreibt, wie Grundstücksmarktberichte systematisch analysiert werden, um daraus maschinenlesbare Marktprofile für ImmoWert/LAB7784 zu erstellen.

Ziel ist nicht, einzelne Berichte ad hoc auszulesen, sondern ein wiederholbares Vorgehen für neue Gutachterausschüsse und Folgemärkte.

Ein Marktprofil beantwortet:

```text
Welche lokalen Daten liefert der Gutachterausschuss?
Welche Bewertungsmodelle sind belastbar nutzbar?
Welche Felder muss das Tool abfragen?
Welche Korrekturen dürfen automatisch gerechnet werden?
Welche Werte sind offiziell, ersatzweise oder manuell?
```

---

## Grundsatz

Nicht jeder Marktbericht enthält dieselben Daten. Deshalb darf ImmoWert keine pauschale Bewertungslogik erzwingen.

Jeder Marktbericht wird als lokales Datenprofil verstanden.

Das Profil muss explizit speichern:

```text
Daten vorhanden
Daten nicht vorhanden
Daten vorhanden, aber nur eingeschränkt nutzbar
Daten nur als Ersatzwert verwendbar
```

Keine stille Annahme. Keine versteckten Defaults.

---

## Zielstruktur eines Marktprofils

Empfohlene JSON-Struktur:

```json
{
  "id": "stuttgart-2024",
  "name": "Stuttgart 2024",
  "committee": "Gutachterausschuss Stuttgart",
  "reportYear": 2024,
  "source": "Grundstücksmarktbericht Stuttgart 2024",
  "profileQuality": "official_model",
  "capabilities": {
    "brwHistory": true,
    "wgfzCorrection": true,
    "plotSizeCorrection": false,
    "officialYieldRates": true,
    "capitalizationFactors": false,
    "rndTables": true,
    "assetValueFactors": true,
    "comparisonFactors": false
  },
  "landValue": {
    "model": "wgfz",
    "formula": "BRW_adj = BRW × Zeitfaktor × UK(WGFZ_ist) / UK(WGFZ_soll) × sonstiger Faktor",
    "requiredInputs": ["baseLandValuePerSqm", "plotArea", "wgfzSoll", "relevantFloorArea"],
    "optionalInputs": ["gardenArea", "gardenFactor", "manualLocationFactor"],
    "disabledInputs": []
  },
  "yieldRates": [],
  "tables": {},
  "notes": []
}
```

---

## Extraktionsprozess

### 1. Bericht identifizieren

Zu erfassen:

```text
Name des Gutachterausschusses
Berichtsjahr
Berichtszeitraum
Gebiet / Zuständigkeit
Veröffentlichungsdatum
Quelle / URL / Dateiname
```

Beispiel:

```json
{
  "committee": "Gutachterausschuss Stuttgart",
  "reportYear": 2024,
  "source": "Grundstücksmarktbericht Stuttgart 2024"
}
```

---

### 2. Inhaltsverzeichnis prüfen

Gezielt suchen nach Kapiteln zu:

```text
Bodenrichtwerte
Umrechnungskoeffizienten
wertrelevante Geschossflächenzahl / WGFZ
Liegenschaftszinsen
Ertragswertfaktoren / Vervielfältiger
Sachwertfaktoren
Vergleichsfaktoren
Restnutzungsdauer / Modernisierung
Gebäudefaktoren
Indexreihen / Preisentwicklung
```

Wichtig: Nicht nur Stichworte suchen. Manche Berichte verwenden andere Begriffe:

```text
wertrelevante Geschossflächenzahl
WGFZ
GFZ-Anpassung
Umrechnungskoeffizienten
Anpassungsfaktoren
Bodenwertkorrektur
Koeffizienten für Maß der baulichen Nutzung
```

---

## Bodenwertdaten

### 3. Bodenrichtwert-Grundmodell erfassen

Fragen:

```text
Bezieht sich der BRW auf erschließungsbeitragsfreien Zustand?
Welche Nutzungsart ist zugrunde gelegt?
Welche wertrelevante GFZ/WGFZ ist zugrunde gelegt?
Gibt es ein Richtwertgrundstück?
Welche Grundstücksgröße ist typisch?
Gibt es Lageklassen?
```

Zu speichern:

```json
{
  "brw": {
    "contributionStatus": "beitragsfrei",
    "referenceUse": "WA",
    "referenceWgfz": 0.6,
    "referencePlotSize": null,
    "notes": []
  }
}
```

Wenn keine Referenz-WGFZ vorhanden ist:

```json
{
  "referenceWgfz": null,
  "warning": "Keine Referenz-WGFZ im Bericht gefunden. Automatische WGFZ-Korrektur nicht zulässig."
}
```

---

### 4. WGFZ-/GFZ-Korrektur extrahieren

Relevant, wenn der Bericht Tabellen oder Formeln für Umrechnungskoeffizienten enthält.

Zu erfassen:

```text
Tabellenname
Nutzungsart / Teilmarkt
Gültigkeitsbereich
WGFZ-Werte
Umrechnungskoeffizienten
Interpolationsregel
Extrapolationsverbot oder Kappung
Quelle / Seitenangabe
```

Beispiel Stuttgart niedriggeschossig:

```json
{
  "id": "stuttgart_lowrise_wgfz",
  "label": "1–2-geschossiger Wohnungsbau",
  "type": "wgfzCoefficientTable",
  "input": "wgfz",
  "interpolation": "linear",
  "extrapolation": "clamp",
  "points": [
    [0.3, 0.69],
    [0.4, 0.75],
    [0.5, 0.80],
    [0.6, 0.84],
    [0.7, 0.88],
    [0.8, 0.92],
    [0.9, 0.96],
    [1.0, 1.00],
    [1.1, 1.05]
  ]
}
```

Formel im Tool:

```text
UK_ist = interpolate(Tabelle, WGFZ_ist)
UK_soll = interpolate(Tabelle, WGFZ_soll)
WGFZ-Faktor = UK_ist / UK_soll
```

Pflichtprüfung:

```text
Wenn WGFZ_soll leer oder 0 ist, darf nicht automatisch 1,0 verwendet werden.
Stattdessen Warnung oder Profil-Default nur mit sichtbarer Herkunft.
```

Testfall:

```text
WGFZ_ist = 0,48
WGFZ_soll = 0,60
Tabelle = lowrise
UK_ist ≈ 0,790
UK_soll = 0,840
Faktor ≈ 0,940
```

---

### 5. Grundstücksgrößen-Korrektur extrahieren

Einige Märkte, z. B. Ludwigsburg-ähnliche Logik, korrigieren nicht über WGFZ, sondern über Abweichung der Grundstücksgröße vom Referenzgrundstück.

Zu suchen:

```text
Grundstücksgrößenfaktoren
Flächenanpassung
Abweichung vom Richtwertgrundstück
Referenzgrundstück
Korrekturfaktor Grundstücksgröße
```

Zu erfassen:

```json
{
  "landValue": {
    "model": "plot_size_factor",
    "requiredInputs": ["baseLandValuePerSqm", "plotArea", "referencePlotSize"],
    "formula": "BRW_adj = BRW × Größenfaktor"
  },
  "tables": {
    "plotSizeFactors": {
      "referencePlotSize": 500,
      "interpolation": "linear",
      "points": []
    }
  }
}
```

Wenn ein Markt weder WGFZ noch Größenfaktoren liefert:

```json
{
  "landValue": {
    "model": "manual_factor",
    "requiredInputs": ["baseLandValuePerSqm", "plotArea"],
    "optionalInputs": ["manualLocationFactor", "gardenArea", "gardenFactor"],
    "formula": "BRW_adj = BRW × Zeitfaktor × sachverständiger Faktor"
  }
}
```

---

## Flächenaufteilung Bodenwert

### 6. Bauland / Garten-/Nebenfläche

Das Tool soll den Bodenwert transparent aufteilen.

Zu prüfen:

```text
Gibt es Hinweise zur Bewertung von hausnahen Gartenflächen?
Gibt es Restflächen / PFG / Grünflächen / Hinterland?
Gibt es Prozentsätze oder Bewertungsansätze?
```

Wenn der Marktbericht keine Faktoren liefert, Standard nur als manuelle Annahme speichern:

```json
{
  "gardenArea": {
    "defaultFactor": 0.4,
    "sourceType": "manual_assumption",
    "note": "Kein lokaler Tabellenwert gefunden. Faktor sachverständig prüfen."
  }
}
```

Rechnung:

```text
Bodenwert Bauland = Baulandfläche × beitragsfreier Bodenwert/m²
Bodenwert Garten-/Nebenfläche = Gartenfläche × Gartenfaktor × beitragsfreier Bodenwert/m²
Gesamtbodenwert = Summe
```

---

## Liegenschaftszinsen

### 7. Liegenschaftszinsen extrahieren

Zu suchen:

```text
Liegenschaftszins
Liegenschaftszinssätze
Zinssatz nach Objektart
Ertragswertobjekte
Mehrfamilienhäuser
Wohn- und Geschäftshäuser
Büro / Geschäftshaus
```

Zu erfassen:

```text
Objektart
Zinssatz
Spanne, Mittelwert oder Median
Stichprobe / Anzahl Fälle
Kauffälle Zeitraum
Quelle / Seite / Tabelle
Datenqualität
```

Beispiel:

```json
{
  "id": "mfh",
  "label": "Reines Mehrfamilienhaus",
  "yieldPercent": 1.5,
  "sourceType": "official_local",
  "confidence": "high",
  "sourceNote": "GMB Stuttgart 2024, Liegenschaftszinsen bebaute Grundstücke"
}
```

Wenn keine lokalen Liegenschaftszinsen vorhanden:

```json
{
  "id": "fallback_external",
  "label": "Ersatzwert aus Nachbarmarkt / Benchmark",
  "yieldPercent": 1.5,
  "sourceType": "official_external",
  "confidence": "medium",
  "adjustmentRecommended": true,
  "sourceNote": "Kein lokaler Zinssatz im Bericht gefunden. Ersatzwert sachverständig prüfen."
}
```

Regel:

```text
Ertragswertverfahren darf keinen Zinssatz ohne Quelle verwenden.
```

---

## Ertragswertfaktoren / Kapitalisierungsfaktoren

### 8. Vervielfältiger und Kapitalisierungsfaktoren prüfen

Einige Berichte enthalten Tabellen für Vervielfältiger oder Ertragswertfaktoren.

Zu suchen:

```text
Vervielfältiger
Kapitalisierungsfaktor
Barwertfaktor
Restnutzungsdauer
Liegenschaftszins
Ertragswertfaktor
```

Zu unterscheiden:

```text
Kapitalisierungsfaktor = mathematisch aus Zins und RND
Ertragswertfaktor = Marktvergleichsfaktor, oft Kaufpreis/Jahresrohertrag oder Kaufpreis/Reinertrag
```

Nicht vermischen.

Mathematischer Kapitalisierungsfaktor:

```text
q = 1 + p
V = (q^n - 1) / (q^n × p)
```

mit:

```text
p = Liegenschaftszins als Dezimalzahl
n = Restnutzungsdauer
```

Wenn Bericht eigene Tabellen vorgibt:

```json
{
  "capitalizationFactors": {
    "sourceType": "official_table",
    "dimensions": ["yield", "remainingLife"],
    "interpolation": "none_or_linear",
    "table": []
  }
}
```

---

## Restnutzungsdauer und Modernisierung

### 9. RND-Tabellen extrahieren

Zu suchen:

```text
Restnutzungsdauer
Gesamtnutzungsdauer
Modernisierungspunkte
Modernisierungsgrad
ImmoWertA Anlage 2
modifizierte Restnutzungsdauer
```

Zu erfassen:

```text
Gesamtnutzungsdauer je Gebäudeart
Punktesystem
Gewerke
maximale Punkte
Tabellenwerte / Faktoren
Anwendungsgrenzen
```

Wichtig:

```text
reales Gebäudealter und Tabellenalter getrennt führen.
```

Definitionen:

```text
reales Gebäudealter = Bewertungsjahr - Baujahr
Tabellenalter = min(reales Gebäudealter, GND), falls Tabelle so arbeitet
Basis-RND = max(0, GND - reales Gebäudealter)
```

Wenn nur ImmoWertA-Standard nutzbar:

```json
{
  "rnd": {
    "sourceType": "immoWertA_reference",
    "method": "modernization_points",
    "confidence": "medium"
  }
}
```

Wenn keine Tabelle extrahiert wurde:

```json
{
  "rnd": {
    "method": "approximation",
    "warning": "Nur Näherung. Tabellenverfahren noch nicht hinterlegt."
  }
}
```

---

## Sachwertdaten

### 10. Sachwertparameter extrahieren

Zu suchen:

```text
Sachwertfaktoren
NHK
Normalherstellungskosten
Regionalfaktor
Baupreisindex
Alterswertminderung
Gebäudestandard
```

Zu erfassen:

```json
{
  "assetValue": {
    "available": true,
    "normalConstructionCosts": "NHK2010_or_report_specific",
    "regionalFactor": null,
    "assetValueFactors": [],
    "notes": []
  }
}
```

Wenn Sachwertdaten nicht vorhanden:

```json
{
  "assetValue": {
    "available": false,
    "warning": "Keine lokalen Sachwertfaktoren im Bericht gefunden."
  }
}
```

---

## Vergleichswertdaten

### 11. Vergleichsfaktoren extrahieren

Zu suchen:

```text
Vergleichsfaktor
Wohnflächenpreis
Gebäudefaktor
Eigentumswohnung
Ein-/Zweifamilienhaus
Mehrfamilienhaus
Rohertragsfaktor
Kaufpreisfaktor
```

Unterscheiden:

```text
€/m² Wohnfläche
Kaufpreis/Jahresrohertrag
Kaufpreis/Jahresreinertrag
Gebäudefaktor
```

Zu speichern:

```json
{
  "comparisonFactors": [
    {
      "id": "mfh_gross_rent_multiplier",
      "label": "Kaufpreisfaktor Jahresrohertrag MFH",
      "factor": null,
      "unit": "x_gross_annual_rent",
      "sourceType": "official_local",
      "confidence": "medium"
    }
  ]
}
```

---

## Indexreihen / Marktanpassung

### 12. Preisindizes und Zeitreihen extrahieren

Zu suchen:

```text
Indexreihe
Preisindex
Bodenpreisindex
Immobilienpreisindex
Marktentwicklung
Zeitreihe
```

Nutzung:

```text
BRW-Zeitfaktor
Markttrend
Plausibilisierung
```

Zu speichern:

```json
{
  "indices": {
    "landPriceIndex": [
      {"year": 2022, "index": 100},
      {"year": 2024, "index": 112}
    ]
  }
}
```

Nicht vermischen:

```text
BRW-Historie ist objekt-/zonebezogen.
Indexreihe ist marktweit.
```

---

## Qualitätsbewertung

Jeder extrahierte Wert erhält eine Qualitätskennzeichnung.

```text
high    = offizieller lokaler Tabellenwert, direkt anwendbar
medium  = offizieller lokaler Wert, aber Einschränkungen oder geringe Fallzahl
medium_external = offizieller Wert aus Nachbarmarkt / Ersatzprofil
low     = manuelle Annahme / Benchmark / unvollständig
```

Beispiel:

```json
{
  "confidence": "medium",
  "reason": "offizieller Wert, aber geringe Fallzahl und breite Spanne"
}
```

---

## Pflichtfelder je Profil ableiten

Das UI soll nur Felder verlangen, die das Marktprofil wirklich braucht.

Beispiele:

### Stuttgart WGFZ-Modell

```json
{
  "requiredInputs": [
    "baseLandValuePerSqm",
    "plotArea",
    "wgfzSoll",
    "relevantFloorArea"
  ],
  "optionalInputs": [
    "gardenArea",
    "gardenFactor",
    "manualLocationFactor"
  ],
  "disabledInputs": []
}
```

### Markt ohne WGFZ

```json
{
  "requiredInputs": [
    "baseLandValuePerSqm",
    "plotArea",
    "buildingLandArea"
  ],
  "optionalInputs": [
    "gardenArea",
    "gardenFactor",
    "manualLocationFactor"
  ],
  "disabledInputs": [
    "wgfzSoll",
    "wgfzCorrectionFactor"
  ]
}
```

---

## Validierungsregeln

Ein Profil ist erst nutzbar, wenn folgende Prüfungen durchlaufen sind:

```text
1. Quelle und Jahr vorhanden
2. Bodenwertmodell eindeutig
3. Pflichtfelder definiert
4. Liegenschaftszinsquelle definiert oder bewusst manuell markiert
5. Tabellenwerte mit Einheiten und Interpolationsregel erfasst
6. Warnungen bei fehlenden lokalen Daten dokumentiert
7. Testfall gerechnet
```

---

## Minimaler Test pro neuem Marktprofil

Für jedes neue Profil einen Testfall anlegen:

```text
BRW
Bewertungsjahr
Grundstücksfläche
Baulandfläche
Gartenfläche
WGFZ_ist / WGFZ_soll falls relevant
Liegenschaftszins
```

Zu prüfen:

```text
Wird der richtige Bodenwertmodus aktiviert?
Sind unnötige Felder deaktiviert?
Sind Pflichtfelder sichtbar?
Wird der Zinssatz mit Quelle angezeigt?
Gibt es Warnungen bei Ersatzwerten?
Rechnet der Bodenwert transparent?
```

---

## Bekannte Marktprofil-Beispiele

### Stuttgart

```text
Profiltyp: official_model
Bodenwert: WGFZ-Korrektur
Liegenschaftszinsen: lokal vorhanden
Qualität: hoch
```

Kernformel:

```text
BRW_adj = BRW × Zeitfaktor × UK(WGFZ_ist) / UK(WGFZ_soll) × sonstiger Faktor
```

### Reutlingen

```text
Profiltyp: partial_official_model
Bodenwert: nicht pauschal Stuttgart-WGFZ übertragen
Liegenschaftszinsen: teilweise vorhanden
Qualität: mittel bis hoch, je Teilmarkt
```

### Fellbach

```text
Profiltyp: limited_local_data
Bodenwert: eher manuell / sachverständiger Faktor, wenn keine lokale Tabelle
Liegenschaftszinsen: ggf. Ersatzwert
Qualität: niedrig bis mittel
```

---

## Agenten-Anweisung für künftige Extraktion

Beim Einlesen eines neuen Marktberichts:

```text
1. Bericht nicht nur zusammenfassen.
2. Tabellen, Faktoren, Modelle und Anwendungsgrenzen extrahieren.
3. Immer zwischen offizieller lokaler Datenbasis und Ersatzannahme unterscheiden.
4. Keine fremden Modelle automatisch übertragen.
5. Fehlende Daten explizit als fehlend markieren.
6. Ergebnis als Marktprofil-JSON strukturieren.
7. Zusätzlich eine kurze menschliche Begründung schreiben.
```

Erwartetes Ergebnis:

```text
market-profiles.json ergänzen
MARKTPROFIL.md bei neuen Extraktionsregeln aktualisieren
Testfall dokumentieren
```

---

## Offene Punkte

```text
- WGFZ-Fix für lowrise/multi sauber implementieren
- Projekt-JSON speichern/laden stabil einbinden
- boG-Liste wiederherstellen falls durch letzten Patch verloren
- rechte Tooltips / transparente Rechnung wiederherstellen
- Marktprofil-Service prüfen
- README nach erfolgreicher Stabilisierung aktualisieren
```
