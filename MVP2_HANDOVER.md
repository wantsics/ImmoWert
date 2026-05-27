# ImmoWert / LAB7784 – MVP2 Handover

Stand: nach Arbeit an Marktprofilen, Bodenwertlogik, Projekt-JSON und mehreren fehlerhaften Connector-Patches.

## Kurzfassung

Dieses Dokument hält den aktuellen fachlichen und technischen Stand fest, damit ein neuer Chat oder Entwickler ohne Kontextverlust weiterarbeiten kann.

Wichtig: Der Branch `mvp2` war zwischenzeitlich durch Connector-Schreibversuche beschädigt. Vor Weiterarbeit zuerst Repo-Zustand prüfen.

---

## Repo und Branches

Repository:

```text
wantsics/ImmoWert
```

Relevante Branches:

```text
main
mvp2
mvp-stable-before-marketprofile-refactor
```

Nicht mehr verwenden:

```text
transparent-result-renderer
```

Der Branch wurde gelöscht bzw. soll ignoriert werden.

Wichtiger sauberer Basiscommit für `mvp2`:

```text
b27a64dc41d44f8449e22ff701212e1f6b4e83a2
Show beitragsfreier Bodenwert per sqm
```

Konservierter MVP-Stand vor größerem Marktprofil-Refactor:

```text
mvp-stable-before-marketprofile-refactor
f1a97dc20bbf69053ef281d353be1b67d13189db
```

---

## Aktuelle Warnung zum technischen Stand

Es gab mehrere fehlerhafte GitHub-Connector-Patches:

1. `index.html` wurde mehrfach versehentlich gekürzt, weil sie einzeilig und sehr lang ist.
2. `ribbon.js` wurde zuletzt versehentlich durch eine Minimalversion ersetzt.
3. Dadurch können auf `mvp2` aktuell Funktionen fehlen:
   - rechte Tooltips
   - boG hinzufügen/entfernen
   - Marktprofil-Overlay
   - BRW-Transparenz
   - eventuell Projekt-IO-Loader

Vor Weiterarbeit prüfen:

```bash
git checkout mvp2
git pull
git log --oneline -10
```

Falls `ribbon.js` nur wenige Zeilen hat oder Marktprofil-/boG-Code fehlt, muss `ribbon.js` aus dem guten Stand wiederhergestellt werden.

Empfehlung:

```text
mvp2 auf b27a64dc41d44f8449e22ff701212e1f6b4e83a2 zurücksetzen
oder gezielt ribbon.js aus main/gutem Commit wiederherstellen.
```

---

## Produktziel

Das Tool soll ein browserbasiertes Immobilienanalyse- und Bewertungswerkzeug werden.

Prinzip:

```text
Eingabe links
Rechnung rechts
jede Zahl mit Herkunft, Formel, Faktor und Quelle
```

Keine Magic Numbers.

Das Tool soll gutachtennah und nachvollziehbar sein, aber keine formale Verkehrswertermittlung ersetzen.

---

## Kernfeatures bisher

### 1. Ertragswertverfahren

Bestehende Rechenkette:

```text
Jahresrohertrag
- Bewirtschaftungskosten
= Jahresreinertrag
- Bodenwertverzinsung
= Gebäudereinertrag
× Kapitalisierungsfaktor
= Gebäudeertragswert
+ Bodenwert
= vorläufiger Ertragswert
+/- boG
= Ertragswert
```

Kapitalisierungsfaktor:

```text
p = Liegenschaftszins / 100
q = 1 + p
V = (q^n - 1) / (q^n × p)
```

Bei `p <= 0` wird näherungsweise `n` verwendet.

---

### 2. Bodenwertlogik

Zielzustand:

```text
BRW-Historie → Zeitfaktor → BRW Zieljahr → WGFZ-/Lagekorrektur → beitragsfreier Bodenwert/m² → Bodenwert Bauland + Bodenwert Garten-/Nebenfläche
```

Gewünschte Transparenz:

```text
BRW Zieljahr: xxx €/m²
Zeitfaktor: x.xxx
WGFZ-/Lage-/Objektfaktor: x.xxx
beitragsfreier Bodenwert/m²: xxx €/m²
Bodenwert Bauland: Fläche × beitragsfreier Bodenwert/m²
Bodenwert Garten-/Nebenfläche: Fläche × Gartenansatz × beitragsfreier Bodenwert/m²
Gesamtbodenwert
```

Beitragsfreier Bodenwert/m²:

```text
BRW Zieljahr × Marktprofil-/WGFZ-/Lagefaktor
```

Beispiel:

```text
Bauland:
420 m² × 2.850 €/m² = 1.197.000 €

Garten-/Nebenfläche:
380 m² × 0,40 × 2.850 €/m² = 433.200 €

Gesamtbodenwert:
1.630.200 €
```

---

### 3. BRW-Historie / Zeitfaktor

Der Bodenrichtwert soll fachlich nicht nur als freies Feld behandelt werden.

Gewünschte Logik:

```text
BRW-Historie ist Eingabequelle.
Jüngstes BRW-Jahr = Basis-BRW.
Wenn Bewertungsjahr = jüngstes BRW-Jahr, dann Zeitfaktor = 1.
Wenn mindestens zwei Jahre vorhanden sind, lineare Extrapolation.
```

Formel:

```text
Gradient = (BRW_neu - BRW_alt) / (Jahr_neu - Jahr_alt)
BRW_Zieljahr = BRW_neu + Gradient × (Bewertungsjahr - Jahr_neu)
Zeitfaktor = BRW_Zieljahr / BRW_neu
```

Transparenztext soll den Gradient und Ziel-BRW zeigen.

---

### 4. WGFZ-Korrektur

Wichtigster aktueller fachlicher Bug.

Testfall:

```text
WGFZ_ist = 0,48
WGFZ_soll = 0,60
```

Erwartung:

```text
Modell: lowrise / 1–2-geschossiger Wohnungsbau
UK_ist ≈ 0,790
UK_soll = 0,840
Faktor = 0,790 / 0,840 = 0,9405
```

Falsch war:

```text
Faktor = 1,000
```

Ursache:

Das Tool nutzte offenbar als Default `multi` / Geschosswohnungsbau. Diese Tabelle beginnt erst bei WGFZ 0,8. Dadurch wurden sowohl 0,48 als auch 0,60 auf denselben Tabellenminimumwert geklemmt:

```text
UK_ist = 0,94
UK_soll = 0,94
Faktor = 1,00
```

Korrekte Logik:

```text
UK_ist  = interpolate(table, WGFZ_ist)
UK_soll = interpolate(table, WGFZ_soll)
WGFZ-Faktor = UK_ist / UK_soll
```

Wenn `WGFZ_soll <= 0` oder leer:

```text
nicht stillschweigend 1,0 verwenden
Warnung anzeigen
keine verdeckte Korrektur
```

Empfohlene Defaults für Stuttgart im niedriggeschossigen Fall:

```text
wgfzModel = lowrise
wgfzSoll = 0.6
```

Transparenztext:

```text
WGFZ-Korrektur: 1–2-geschossiger Wohnungsbau
WGFZ_soll 0,60 → UK_soll 0,840
WGFZ_ist 0,48 → UK_ist 0,790
Faktor = UK_ist / UK_soll = 0,940
sonstiger Faktor 1,000
Gesamtfaktor 0,940
```

---

### 5. Marktprofile / Gutachterausschüsse

Es gibt bzw. gab ein Marktprofil-Konzept.

Ziel:

```text
Bewertungslogik hängt vom Gutachterausschuss / Grundstücksmarktbericht ab.
Nicht jeder Ausschuss liefert dieselben Tabellen oder Zinssätze.
```

Profile:

```text
Stuttgart 2024
Reutlingen 2025
Fellbach 2022
```

Stuttgart:

```text
WGFZ-Korrektur vorhanden
Liegenschaftszinsen vorhanden
Umrechnungskoeffizienten vorhanden
```

Reutlingen:

```text
teilweise lokale Modelle
keine generelle Stuttgart-WGFZ-Logik im individuellen Wohnungsbau
```

Fellbach:

```text
begrenzte lokale Daten
Liegenschaftszins ggf. externer Ersatzwert / sachverständige Annahme
```

Zielstruktur je Profil:

```json
{
  "id": "stuttgart-2024",
  "name": "Stuttgart 2024",
  "profileQuality": "official_model",
  "landValue": {
    "model": "wgfz",
    "requiredInputs": ["baseLandValuePerSqm", "plotArea", "wgfzSoll", "relevantFloorArea"],
    "optionalInputs": ["gardenArea", "gardenFactor", "manualLocationFactor"],
    "formula": "BRW_adj = BRW × Zeitfaktor × UK(WGFZ_ist) / UK(WGFZ_soll) × sonstiger Faktor"
  },
  "yields": []
}
```

---

### 6. Liegenschaftszins

Problem:

```text
Ertragswertverfahren braucht zwingend einen Liegenschaftszins.
Nicht jeder GAA liefert lokale Zinssätze.
```

Ziel:

Jeder Zinssatz braucht Herkunft und Datenqualität.

Schema:

```json
{
  "yieldPercent": 1.5,
  "sourceType": "official_local",
  "sourceProfile": "stuttgart-2024",
  "adjustmentRecommended": false,
  "confidence": "high"
}
```

Mögliche Quellen:

```text
official_local
official_external
manual
benchmark
```

Datenqualität:

```text
high = lokal offiziell
medium = regional offiziell / Ersatzwert
low = manuell / Benchmark
```

---

### 7. boG

boG = besondere objektspezifische Grundstücksmerkmale.

Gewünschte UI:

```text
+ boG hinzufügen
Art: Zuschlag / Abschlag
Betrag
Kommentar
Entfernen
```

Rechnung:

```text
boG saldiert = Summe Zuschläge - Summe Abschläge
```

Beispiel:

```text
Abschlag · Sanierungsstau Dach: -40.000 €
Zuschlag · Ausbaureserve DG: +25.000 €
Saldo: -15.000 €
```

Diese Funktion war in einem guten `ribbon.js`-Stand vorhanden, ging aber im letzten fehlerhaften Patch verloren.

---

### 8. Restnutzungsdauer / RND

Es gibt Modernisierungsregler mit 0–20 Punkten.

Wichtig:

```text
reales Gebäudealter darf nicht auf GND gekappt angezeigt werden.
```

Saubere Begriffe:

```text
reales Gebäudealter = Bewertungsjahr - Baujahr
Tabellenalter = min(reales Gebäudealter, GND), falls Tabelle so arbeitet
Basis-RND = max(0, GND - reales Gebäudealter)
Modernisierungspunkte
modifizierte RND
```

Gewünscht:

```text
Wahlweise Tabellenverfahren oder Formel/Näherung.
Tabellenverfahren bevorzugt.
Formel nur Fallback.
```

Transparenztext soll klar unterscheiden:

```text
Bewertungsjahr
Baujahr
reales Alter
GND
Basis-RND
Tabellenalter
Modernisierungspunkte
angesetzte RND
```

---

### 9. Rechte Ergebnisbox / Transparenz

Ziel:

```text
rechts keine bloße Ergebnisliste
sondern aufklappbare Rechenkette oder mindestens Tooltips je Ergebniszahl
```

Gewünschte Sektionen:

```text
Bodenwert
Ertragswert
Restnutzungsdauer
boG
Ankauf
```

Bodenwert rechts:

```text
BRW-Historie
BRW Zieljahr
Zeitfaktor
WGFZ-/Lage-/Objektfaktor
beitragsfreier Bodenwert/m²
Bodenwert Bauland
Bodenwert Garten-/Nebenfläche
Gesamtbodenwert
```

Ertragswert rechts:

```text
Jahresrohertrag
Bewirtschaftungskosten
Jahresreinertrag
Bodenwertverzinsung
Gebäudereinertrag
Kapitalisierungsfaktor
Gebäudeertragswert
vorläufiger Ertragswert
boG
finaler Ertragswert
```

---

### 10. Tooltips

Tooltips sind wichtig und sollen bleiben.

CSS existierte in `style.css`:

```css
.info-tooltip:hover::after { ... }
.info-tooltip:hover::before { ... }
```

Wunsch:

```text
Tooltips auch im rechten Ergebnisfenster.
Tooltip je Ergebniszahl mit Formel, Eingaben und Quelle.
```

Beispiel:

```text
Bodenwertverzinsung = Bodenwert × Liegenschaftszins
1.630.200 € × 1,5 % = 24.453 €
Quelle Liegenschaftszins: Stuttgart 2024, reines MFH
```

---

### 11. Projekt speichern / laden

Wunsch zuletzt:

```text
Nicht kompliziert.
Einfach Eingaben als JSON speichern und laden.
```

Nicht gemeint: Git speichern.

Gemeint: Bewertungsstand im Tool exportieren/importieren.

MVP-Anforderung:

```text
Projekt speichern → JSON-Datei herunterladen
Projekt laden → JSON-Datei auswählen und Felder laden
```

Dateiendung:

```text
*.immowert.json
```

Zu speichern:

```json
{
  "schema": "immowert-project-v1",
  "savedAt": "...",
  "fields": {},
  "units": [],
  "brwHistory": [],
  "modernization": {},
  "bogItems": [],
  "activeMarketProfile": "stuttgart-2024"
}
```

Nach Laden aufzurufen:

```js
renderUnits()
renderBrwHistory()
renderModernization()
renderBogItems()
syncWgfzFactor()
update()
```

Es wurde versucht, dafür `mvp2-project-io.js` anzulegen. Falls vorhanden, prüfen ob Datei korrekt geladen wird.

Wichtig: Im letzten fehlerhaften Stand wurde sie über eine stark reduzierte `ribbon.js` geladen. Diese Lösung ist nicht sauber, wenn dadurch die anderen Overlay-Funktionen fehlen.

---

## Konkrete offene Aufgaben

### Sofort

1. `mvp2` reparieren:
   - `index.html` vollständig?
   - `ribbon.js` vollständig?
   - boG-Liste wieder da?
   - Tooltips wieder da?

2. Wenn kaputt:
   - `mvp2` auf `b27a64dc41d44f8449e22ff701212e1f6b4e83a2` zurücksetzen
   - oder `ribbon.js` aus gutem Stand wiederherstellen

3. Projekt-JSON sauber einbinden:
   - vorzugsweise über `index.html` Script-Tag oder sauberen Loader
   - keine gekürzte HTML schreiben

4. WGFZ-Fix umsetzen:
   - Default `lowrise`
   - Default `wgfzSoll = 0.6`
   - kein `|| 1` bei fehlendem Soll
   - Warnung bei ungültiger Soll-WGFZ
   - Testfall ergibt Faktor ca. `0.94`

### Danach

5. Rechte Ergebnisbox verbessern:
   - Tooltips oder Accordion
   - Bodenwert Bauland/Garten getrennt

6. README / Doku nachziehen.

---

## Bekannte technische Stolperfallen

### Einzeilige `index.html`

Die Datei ist sehr lang und einzeilig. Der Connector gibt sie oft gekürzt zurück.

Gefahr:

```text
update_file mit gekürztem Inhalt zerstört die Seite.
```

Daher:

```text
Nicht komplette index.html ersetzen, wenn vollständiger Inhalt nicht sicher vorliegt.
```

Besser:

```text
separate JS-Dateien
kleine gezielte Patches
oder Git Tree/Blob API mit vollständigem Blob
```

### `ribbon.js`

Letzter Fehler:

```text
ribbon.js wurde versehentlich auf Minimalfunktionen reduziert.
```

Dadurch fehlten:

```text
boG hinzufügen/entfernen
rechte Tooltips
Marktprofil-Service
BRW-Transparenz
```

Vor Weiterarbeit unbedingt prüfen.

---

## Fachliche Testfälle

### WGFZ-Test

Eingaben:

```text
Modell: lowrise
WGFZ_ist = 0,48
WGFZ_soll = 0,60
```

Erwartung:

```text
UK_ist ≈ 0,790
UK_soll = 0,840
Faktor ≈ 0,940
```

### BRW-Historie-Test

Eingaben:

```text
2026: 3000 €/m²
Bewertungsjahr 2026
```

Erwartung:

```text
Basis-BRW = 3000 €/m²
Zeitfaktor = 1,000
```

Mit zwei Jahren:

```text
2022: 2500 €/m²
2024: 2800 €/m²
Bewertungsjahr 2026
```

Erwartung:

```text
Gradient = 150 €/m²·a
BRW Zieljahr = 3100 €/m²
Zeitfaktor = 3100 / 2800 = 1,107
```

### Projekt speichern/laden-Test

1. Objektname ändern
2. BRW-Historie eintragen
3. Einheit hinzufügen
4. WGFZ lowrise / Soll 0.6 setzen
5. boG hinzufügen
6. Projekt speichern
7. Seite neu laden
8. Projekt laden
9. Alle Werte müssen wieder da sein

---

## Leitprinzip

```text
Keine Magic.
Jede Zahl muss erklärbar sein:
- Woher kommt sie?
- Welche Formel?
- Welche Eingaben?
- Welcher Faktor?
- Welche Quelle?
```
