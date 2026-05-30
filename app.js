let wgfzCore = null;

import('./src/calc/wgfz.js')
  .then((module) => {
    wgfzCore = module;
    update();
  })
  .catch((error) => {
    console.error('WGFZ core could not be loaded', error);
  });

function todayIsoDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

const MODERNIZATION_ELEMENTS = [
  {
    id: 'roof',
    label: 'Dacherneuerung inkl. Wärmedämmung',
    max: 4,
    info: 'Dach inkl. Dämmung: bis 5 Jahre = 4 Punkte, 6–10 Jahre = 3 Punkte, 11–15 Jahre = 2 Punkte, 16–20 Jahre = 1 Punkt, älter/nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'windows',
    label: 'Fenster und Außentüren',
    max: 2,
    info: 'Fenster/Außentüren: bis 10 Jahre = 2 Punkte, 11–20 Jahre = 1 Punkt, älter/nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'systems',
    label: 'Leitungssysteme Strom/Gas/Wasser/Abwasser',
    max: 2,
    info: 'Leitungssysteme: umfassend erneuert = 2 Punkte, teilweise/älter modernisiert = 1 Punkt, nicht modernisiert = 0 Punkte. Modellkonform zum Marktbericht prüfen.',
  },
  {
    id: 'heating',
    label: 'Heizungsanlage',
    max: 2,
    info: 'Heizung: bis 10 Jahre = 2 Punkte, 11–20 Jahre = 1 Punkt, älter/nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'facade',
    label: 'Wärmedämmung Außenwände',
    max: 4,
    info: 'Außenwanddämmung: bis 5 Jahre = 4 Punkte, 6–10 Jahre = 3 Punkte, 11–15 Jahre = 2 Punkte, 16–20 Jahre = 1 Punkt, älter/nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'bath',
    label: 'Bäder',
    max: 2,
    info: 'Bäder: modern/umfassend erneuert = 2 Punkte, teilweise/älter modernisiert = 1 Punkt, nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'interior',
    label: 'Innenausbau Decken/Fußböden/Treppen',
    max: 2,
    info: 'Innenausbau: umfassend modernisiert = 2 Punkte, teilweise modernisiert = 1 Punkt, nicht modernisiert = 0 Punkte.',
  },
  {
    id: 'layout',
    label: 'wesentliche Grundrissverbesserung',
    max: 2,
    info: 'Grundrissverbesserung: wesentliche Verbesserung = 1–2 Punkte. Keine zeitabhängige Bauteilmodernisierung, sondern funktionaler Eingriff.',
  },
];

const DEFAULT_MODERNIZATION = Object.fromEntries(
  MODERNIZATION_ELEMENTS.map((item) => [item.id, 0]),
);

const DEFAULT_CASE = {
  objectName: 'Neues Objekt',
  valuationDate: todayIsoDate(),
  borisAddress: '',
  constructionYear: '',
  totalArea: '',
  baseLandValuePerSqm: '',
  timeAdjustmentFactor: 1,
  landFeatureFactor: 1,
  plotArea: '',
  relevantFloorArea: '',
  buildingLandArea: '',
  gardenArea: 0,
  gardenFactor: 0.1,
  operatingCostRate: 12.58,
  propertyYield: 1.5,
  totalUsefulLife: 80,
  remainingLife: 40,
  marketAdjustment: 0,
  bogDeductions: 0,
  bogAdditions: 0,
  purchasePrice: '',
  purchaseCostsRate: 10,
  negotiationBuffer: 5,
  modernization: DEFAULT_MODERNIZATION,
};

let brwHistory = [];
let modernization = { ...DEFAULT_MODERNIZATION };
let units = [
  { name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 },
];

function numberValue(id) {
  const element = document.getElementById(id);
  return element ? parseFloat(String(element.value).replace(',', '.')) || 0 : 0;
}

function textValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : '';
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? '';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function euro(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percent(value) {
  return `${(value || 0).toFixed(2)} %`;
}

function getYearFromDate(value) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return Number.isFinite(date.getFullYear()) ? date.getFullYear() : new Date().getFullYear();
}

function numberValueFromElement(element) {
  return parseFloat(String(element.value).replace(',', '.')) || 0;
}

function modernizationPoints() {
  return MODERNIZATION_ELEMENTS.reduce(
    (sum, item) => sum + (Number(modernization[item.id]) || 0),
    0,
  );
}

function buildingAge(data) {
  return Math.max(
    0,
    getYearFromDate(data.valuationDate) -
      (Number(data.constructionYear) || getYearFromDate(data.valuationDate)),
  );
}

function calculateModifiedRND(data) {
  const gnd = Math.max(1, Number(data.totalUsefulLife) || 80);
  const realAge = buildingAge(data);
  const tableAge = Math.min(realAge, gnd);
  const baseRnd = Math.max(0, gnd - realAge);
  const points = Math.max(0, Math.min(20, modernizationPoints()));
  const rejuvenation = tableAge * (points / 20) * 0.55;
  const rnd = Math.round(Math.min(gnd, Math.max(baseRnd, baseRnd + rejuvenation)));
  return {
    gnd,
    realAge,
    tableAge,
    baseRnd,
    points,
    rnd,
    info: `RND transparent: Bewertungsjahr ${getYearFromDate(data.valuationDate)}; Baujahr ${data.constructionYear || '–'}; reales Gebäudealter ${realAge} J.; GND ${gnd} J.; Basis-RND = max(0, ${gnd} − ${realAge}) = ${baseRnd} J.; Alter für Tabellen-/Näherungslogik = min(${realAge}, ${gnd}) = ${tableAge} J.; Modernisierung ${points}/20 Punkte. Fachlich final: Punkte + reales Alter/Tabellenalter + GND ziehen Tabellenwert/Faktor aus Grundstücksmarktbericht/ImmoWertA Anlage 2; daraus modifizierte RND; daraus Kapitalisierungsfaktor/Vervielfältiger. Aktuell noch Näherung: Tabellenalter × Punkte/20 × 0,55 = ${rejuvenation.toFixed(1)} J.; angesetzte RND = ${rnd} J.`,
  };
}

function calculateBrwTimeFactor(currentBrw, valuationYear) {
  const currentYear = valuationYear - 1;
  const map = new Map();
  brwHistory
    .map((point) => ({ year: Number(point.year), value: Number(point.value) }))
    .filter((point) => point.year > 0 && point.value > 0 && point.year !== currentYear)
    .forEach((point) => map.set(point.year, point.value));

  if (!currentBrw || map.size === 0) {
    return {
      factor: 1,
      info: 'BRW-Zeitfaktor: keine auswertbare Historie angegeben, daher Faktor 1,00.',
    };
  }

  const points = [
    ...Array.from(map, ([year, value]) => ({ year, value })),
    { year: currentYear, value: currentBrw },
  ].sort((a, b) => a.year - b.year);

  const first = points[0];
  const last = points[points.length - 1];
  const span = last.year - first.year;

  if (span <= 0) {
    return { factor: 1, info: 'BRW-Zeitfaktor: Historie nicht auswertbar, daher Faktor 1,00.' };
  }

  const trend = (last.value - first.value) / span;
  const target = currentBrw + trend * (valuationYear - currentYear);
  const factor = target > 0 ? target / currentBrw : 1;

  return {
    factor,
    info: `BRW-Zeitfaktor: aktueller BRW ${currentYear} = ${euro(currentBrw)}/m²; Trend aus ${first.year} (${euro(first.value)}/m²) bis ${last.year} (${euro(last.value)}/m²); Zieljahr ${valuationYear} → ${euro(target)}/m²; Faktor ${factor.toFixed(3)}.`,
  };
}

function calculateCapitalizationFactor(yieldPercent, years) {
  const p = yieldPercent / 100;
  if (years <= 0) return 0;
  if (p <= 0) return years;
  const q = 1 + p;
  return (Math.pow(q, years) - 1) / (Math.pow(q, years) * p);
}

function unitAnnualIncome(unit) {
  const factor = Number(unit.factor) || 0;
  if (unit.rentMode === 'monthly') {
    return (Number(unit.monthlyRent) || 0) * 12 * factor;
  }
  return (Number(unit.area) || 0) * (Number(unit.rentPerSqm) || 0) * 12 * factor;
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function getWgfzState() {
  const activeElement = document.getElementById('wgfzActive');
  const active = activeElement ? activeElement.checked : true;
  const model = document.getElementById('wgfzModel')?.value || 'lowrise';
  const referenceWgfz = numberValue('wgfzSoll') || 1;
  const manualFactor = numberValue('manualLocationFactor') || 1;
  const extrapolate = (document.getElementById('wgfzExtrapolate')?.value || '0') === '1';
  const plotArea = numberValue('plotArea');
  const relevantFloorArea = numberValue('relevantFloorArea');
  const targetWgfz = plotArea > 0 && relevantFloorArea > 0 ? relevantFloorArea / plotArea : 0;

  if (!active) {
    return {
      ok: true,
      active,
      model,
      referenceWgfz,
      targetWgfz,
      manualFactor,
      extrapolate,
      plotArea,
      relevantFloorArea,
      referenceCoefficient: null,
      targetCoefficient: null,
      wgfzFactor: 1,
      totalFactor: manualFactor,
      warnings: ['WGFZ-Korrektur deaktiviert. Nur manueller Lage-/Objektfaktor wird verwendet.'],
      explanation: 'WGFZ-Korrektur deaktiviert.',
    };
  }

  if (!wgfzCore) {
    return {
      ok: false,
      active,
      model,
      referenceWgfz,
      targetWgfz,
      manualFactor,
      extrapolate,
      plotArea,
      relevantFloorArea,
      referenceCoefficient: null,
      targetCoefficient: null,
      wgfzFactor: 1,
      totalFactor: manualFactor,
      warnings: ['WGFZ-Core wird noch geladen.'],
      explanation: 'WGFZ-Core wird noch geladen.',
    };
  }

  if (!(plotArea > 0) || !(relevantFloorArea > 0)) {
    return {
      ok: false,
      active,
      model,
      referenceWgfz,
      targetWgfz: 0,
      manualFactor,
      extrapolate,
      plotArea,
      relevantFloorArea,
      referenceCoefficient: null,
      targetCoefficient: null,
      wgfzFactor: 1,
      totalFactor: manualFactor,
      warnings: [
        'Keine WGFZ-Korrektur möglich: Grundstücksfläche und wertrelevante Geschossfläche müssen eingegeben werden. Keine stille Ersatzrechnung mit Wohnfläche.',
      ],
      explanation: 'Keine WGFZ-Korrektur möglich.',
    };
  }

  try {
    const result = wgfzCore.calculateWgfzCorrection({
      model,
      referenceWgfz,
      targetWgfz,
      manualFactor,
      extrapolate,
    });

    return {
      ...result,
      active,
      plotArea,
      relevantFloorArea,
      totalFactor: result.totalFactor ?? manualFactor,
      wgfzFactor: result.wgfzFactor ?? 1,
    };
  } catch (error) {
    return {
      ok: false,
      active,
      model,
      referenceWgfz,
      targetWgfz,
      manualFactor,
      extrapolate,
      plotArea,
      relevantFloorArea,
      referenceCoefficient: null,
      targetCoefficient: null,
      wgfzFactor: 1,
      totalFactor: manualFactor,
      warnings: [error.message],
      explanation: 'WGFZ-Korrektur konnte nicht berechnet werden.',
    };
  }
}

function syncWgfzFactor() {
  const state = getWgfzState();
  const totalFactor = safeNumber(state.totalFactor, state.manualFactor || 1);
  const wgfzFactor = safeNumber(state.wgfzFactor, 1);

  setValue('landFeatureFactor', totalFactor.toFixed(3));
  setValue('wgfzIst', state.targetWgfz ? state.targetWgfz.toFixed(3) : '');
  setValue('wgfzCorrectionFactor', wgfzFactor.toFixed(3));
  setValue(
    'wgfzReferenceCoeff',
    state.referenceCoefficient != null ? Number(state.referenceCoefficient).toFixed(3) : '',
  );
  setValue(
    'wgfzTargetCoeff',
    state.targetCoefficient != null ? Number(state.targetCoefficient).toFixed(3) : '',
  );

  const info = document.getElementById('wgfzInfo');
  if (info) {
    const modelLabel =
      state.model === 'lowrise' ? '1–2-geschossiger Wohnungsbau' : 'Geschosswohnungsbau';
    const warningText = state.warnings?.length ? ` Warnung: ${state.warnings.join(' ')}` : '';
    info.textContent = `WGFZ-Korrektur: ${modelLabel}; WGFZ_Richtwert ${state.referenceWgfz.toFixed(3)} → UK_ref ${state.referenceCoefficient != null ? Number(state.referenceCoefficient).toFixed(3) : '–'}; WGFZ_Objekt ${state.targetWgfz ? state.targetWgfz.toFixed(3) : '–'} → UK_obj ${state.targetCoefficient != null ? Number(state.targetCoefficient).toFixed(3) : '–'}; Faktor = ${wgfzFactor.toFixed(3)}; manueller Faktor ${state.manualFactor.toFixed(3)}; Gesamtfaktor ${totalFactor.toFixed(3)}.${warningText}`;
  }

  return state;
}

function injectWgfzBlock() {
  if (document.getElementById('wgfzBlock')) return;

  const landFeatureFactorInput = document.getElementById('landFeatureFactor');
  const label = landFeatureFactorInput?.closest('label');
  if (!landFeatureFactorInput || !label) return;

  landFeatureFactorInput.readOnly = true;

  const block = document.createElement('div');
  block.id = 'wgfzBlock';
  block.className = 'full-width history-block';
  block.innerHTML = `
    <div class="section-title-inline">
      <strong>WGFZ-Korrektur <span class="info-tooltip" data-tooltip="Bodenwertkorrektur: BRW × UK(WGFZ_Objekt) / UK(WGFZ_Richtwert). Keine stille Kappung außerhalb der Tabellenwerte. Wertrelevante Geschossfläche muss explizit eingegeben werden; Wohnfläche wird nicht mehr als Ersatz verwendet.">i</span></strong>
      <small>Umrechnungskoeffizienten nach WGFZ</small>
    </div>
    <div class="grid three compact-grid">
      <label>WGFZ-Korrektur aktiv
        <input type="checkbox" id="wgfzActive" checked>
        <small>aus = nur manueller Faktor</small>
      </label>
      <label>Modell
        <select id="wgfzModel"><option value="lowrise">1–2-geschossiger Wohnungsbau</option><option value="multi">Geschosswohnungsbau</option></select>
      </label>
      <label>WGFZ_Richtwert BORIS
        <input type="number" id="wgfzSoll" min="0" step="0.01" value="1.0"><small>Richtwertgrundstück</small>
      </label>
      <label>WGFZ_Objekt
        <input type="number" id="wgfzIst" readonly><small>wertrelevante Geschossfläche / Grundstück</small>
      </label>
      <label>UK_Richtwert
        <input type="number" id="wgfzReferenceCoeff" readonly><small>aus Tabelle</small>
      </label>
      <label>UK_Objekt
        <input type="number" id="wgfzTargetCoeff" readonly><small>aus Tabelle</small>
      </label>
      <label>WGFZ-Faktor
        <input type="number" id="wgfzCorrectionFactor" readonly><small>UK_Objekt / UK_Richtwert</small>
      </label>
      <label>sonstiger Lage-/Objektfaktor
        <input type="number" id="manualLocationFactor" min="0" step="0.01" value="1.00"><small>zusätzlich, keine Doppelkorrektur</small>
      </label>
      <label>Extrapolation
        <select id="wgfzExtrapolate"><option value="0">nein</option><option value="1">ja, mit Warnung</option></select>
      </label>
    </div>
    <p class="hint full-width" id="wgfzInfo">–</p>`;

  label.parentNode.insertBefore(block, label.nextSibling);

  [
    'wgfzActive',
    'wgfzModel',
    'wgfzSoll',
    'manualLocationFactor',
    'wgfzExtrapolate',
    'plotArea',
    'relevantFloorArea',
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      syncWgfzFactor();
      update();
    });
  });

  ['wgfzActive', 'wgfzModel', 'wgfzExtrapolate'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      syncWgfzFactor();
      update();
    });
  });

  syncWgfzFactor();
}

function readCase() {
  const wgfz = syncWgfzFactor();
  const valuationYear = getYearFromDate(textValue('valuationDate'));
  const brwFactor = calculateBrwTimeFactor(numberValue('baseLandValuePerSqm'), valuationYear);

  setValue('timeAdjustmentFactor', brwFactor.factor.toFixed(3));
  setText('brwTrendInfo', brwFactor.info);

  const data = {
    objectName: textValue('objectName'),
    valuationDate: textValue('valuationDate'),
    borisAddress: textValue('borisAddress'),
    constructionYear: numberValue('constructionYear'),
    totalArea: numberValue('totalArea'),
    baseLandValuePerSqm: numberValue('baseLandValuePerSqm'),
    timeAdjustmentFactor: brwFactor.factor,
    landFeatureFactor: numberValue('landFeatureFactor'),
    plotArea: numberValue('plotArea'),
    relevantFloorArea: numberValue('relevantFloorArea'),
    buildingLandArea: numberValue('buildingLandArea'),
    gardenArea: numberValue('gardenArea'),
    gardenFactor: numberValue('gardenFactor'),
    operatingCostRate: numberValue('operatingCostRate'),
    propertyYield: numberValue('propertyYield'),
    totalUsefulLife: numberValue('totalUsefulLife') || 80,
    remainingLife: numberValue('remainingLife'),
    marketAdjustment: numberValue('marketAdjustment'),
    bogDeductions: numberValue('bogDeductions'),
    bogAdditions: numberValue('bogAdditions'),
    purchasePrice: numberValue('purchasePrice'),
    purchaseCostsRate: numberValue('purchaseCostsRate'),
    negotiationBuffer: numberValue('negotiationBuffer'),
    units,
    brwHistory,
    modernization,
    wgfz,
  };

  const rnd = calculateModifiedRND(data);
  setValue('remainingLife', rnd.rnd);
  setValue('modernizationPointsDisplay', `${rnd.points} / 20`);
  setText('rndInfo', rnd.info);
  setText('modernizationPoints', `${rnd.points} / 20`);
  setText('rndSummary', `RND ${rnd.rnd} Jahre`);
  data.remainingLife = rnd.rnd;

  return data;
}

function calculate(data) {
  const actualWgfz =
    data.plotArea > 0 && data.relevantFloorArea > 0
      ? data.relevantFloorArea / data.plotArea
      : data.wgfz?.targetWgfz || 0;
  const adjustedBrw = data.baseLandValuePerSqm * data.timeAdjustmentFactor * data.landFeatureFactor;
  const landValue =
    adjustedBrw * data.buildingLandArea + adjustedBrw * data.gardenArea * data.gardenFactor;
  const grossIncome = data.units.reduce((sum, unit) => sum + unitAnnualIncome(unit), 0);
  const operatingCosts = (grossIncome * data.operatingCostRate) / 100;
  const netIncome = grossIncome - operatingCosts;
  const landInterest = (landValue * data.propertyYield) / 100;
  const buildingIncome = netIncome - landInterest;
  const multiplier = calculateCapitalizationFactor(data.propertyYield, data.remainingLife);
  const buildingValue = buildingIncome * multiplier;
  const preliminaryIncomeValue = buildingValue + landValue;
  const marketAdjustedValue = preliminaryIncomeValue * (1 + data.marketAdjustment / 100);
  const bogTotal = data.bogAdditions - data.bogDeductions;
  const incomeValue = marketAdjustedValue + bogTotal;
  const targetOffer = incomeValue * (1 - data.negotiationBuffer / 100);
  const totalAcquisitionCost = data.purchasePrice * (1 + data.purchaseCostsRate / 100);
  const valueGap = incomeValue - totalAcquisitionCost;
  const rentMultiplier = grossIncome > 0 ? data.purchasePrice / grossIncome : 0;
  const grossYield = data.purchasePrice > 0 ? (grossIncome / data.purchasePrice) * 100 : 0;
  const netYield = data.purchasePrice > 0 ? (netIncome / data.purchasePrice) * 100 : 0;

  return {
    actualWgfz,
    adjustedBrw,
    landValue,
    grossIncome,
    operatingCosts,
    netIncome,
    landInterest,
    buildingIncome,
    multiplier,
    buildingValue,
    preliminaryIncomeValue,
    marketAdjustedValue,
    bogTotal,
    incomeValue,
    targetOffer,
    totalAcquisitionCost,
    valueGap,
    rentMultiplier,
    grossYield,
    netYield,
  };
}

function renderModernization() {
  const container = document.getElementById('modernizationContainer');
  if (!container) return;
  container.innerHTML = MODERNIZATION_ELEMENTS.map((item) => {
    const value = modernization[item.id] || 0;
    return `<div class="modernization-row"><div class="modernization-label"><span>${item.label}<span class="info-tooltip" data-tooltip="${item.info}">i</span></span><strong data-modernization-value="${item.id}">${value} / ${item.max}</strong></div><div class="modernization-control"><input type="range" min="0" max="${item.max}" step="1" value="${value}" data-modernization-id="${item.id}"></div></div>`;
  }).join('');
}

function updateModernizationDisplay() {
  MODERNIZATION_ELEMENTS.forEach((item) => {
    const element = document.querySelector(`[data-modernization-value="${item.id}"]`);
    if (element) element.textContent = `${modernization[item.id] || 0} / ${item.max}`;
  });
}

function renderUnits() {
  const container = document.getElementById('unitsContainer');
  if (!container) return;
  container.innerHTML = units
    .map(
      (unit, index) =>
        `<div class="unit-card"><div class="unit-head"><strong>${unit.name || `Einheit ${index + 1}`}</strong><button type="button" data-remove-unit="${index}" ${units.length === 1 ? 'disabled' : ''}>Entfernen</button></div><div class="grid three compact-grid"><label>Name<input data-unit-field="name" data-unit-index="${index}" value="${unit.name || ''}" /></label><label>Fläche<input type="number" data-unit-field="area" data-unit-index="${index}" value="${unit.area || 0}" min="0" step="1" /><small>m²</small></label><label>Mietmodus<select data-unit-field="rentMode" data-unit-index="${index}"><option value="sqm" ${unit.rentMode === 'sqm' ? 'selected' : ''}>€/m²</option><option value="monthly" ${unit.rentMode === 'monthly' ? 'selected' : ''}>Monatsmiete</option></select></label><label>Miete €/m²<input type="number" data-unit-field="rentPerSqm" data-unit-index="${index}" value="${unit.rentPerSqm || 0}" min="0" step="0.1" /></label><label>Monatsmiete<input type="number" data-unit-field="monthlyRent" data-unit-index="${index}" value="${unit.monthlyRent || 0}" min="0" step="10" /></label><label>Faktor<input type="number" data-unit-field="factor" data-unit-index="${index}" value="${unit.factor || 1}" min="0" step="0.1" /></label></div><small data-unit-income="${index}">Jahresrohertrag: ${euro(unitAnnualIncome(unit))}</small></div>`,
    )
    .join('');
}

function updateUnitIncome(index) {
  const element = document.querySelector(`[data-unit-income="${index}"]`);
  if (element) element.textContent = `Jahresrohertrag: ${euro(unitAnnualIncome(units[index]))}`;
}

function renderBrwHistory() {
  const container = document.getElementById('brwHistoryContainer');
  if (!container) return;
  container.innerHTML = brwHistory
    .map(
      (point, index) =>
        `<div class="history-row"><label>Jahr<input type="number" data-history-field="year" data-history-index="${index}" value="${point.year || ''}" min="1900" max="2100" step="1" /></label><label>BRW<input type="number" data-history-field="value" data-history-index="${index}" value="${point.value || ''}" min="0" step="10" /></label><button type="button" data-remove-history="${index}">Entfernen</button></div>`,
    )
    .join('');
}

function update() {
  const data = readCase();
  const result = calculate(data);

  setValue('actualWgfz', result.actualWgfz ? result.actualWgfz.toFixed(3) : '');
  setValue('unitCountDisplay', data.units.length);
  setText('headlineValue', euro(result.incomeValue));
  setText('headlineMeta', `${data.objectName} · ${data.valuationDate}`);
  setText('objectSummary', `${data.borisAddress || 'keine Adresse'} · ${data.totalArea || 0} m²`);
  setText('landSummary', euro(result.landValue));
  setText('incomeSummary', `${euro(result.grossIncome)} / Jahr`);
  setText('modelSummary', `LZ ${data.propertyYield.toFixed(2)} % · RND ${data.remainingLife} J.`);
  setText('bogSummary', euro(result.bogTotal));
  setText('purchaseSummary', `Ziel ${euro(result.targetOffer)}`);

  [
    'adjustedBrw',
    'landValue',
    'grossIncome',
    'operatingCosts',
    'netIncome',
    'landInterest',
    'buildingIncome',
    'buildingValue',
    'preliminaryIncomeValue',
    'bogTotal',
    'incomeValue',
    'targetOffer',
    'totalAcquisitionCost',
    'valueGap',
  ].forEach((id) => {
    setText(id, id === 'adjustedBrw' ? `${euro(result[id])} / m²` : euro(result[id]));
  });

  setText('multiplier', result.multiplier.toFixed(3));
  setText('rentMultiplier', `${result.rentMultiplier.toFixed(1)}x`);
  setText('grossYield', percent(result.grossYield));
  setText('netYield', percent(result.netYield));

  let verdict = 'Neutral. Die Parameter prüfen und mit Marktbericht/Gutachten abgleichen.';
  if (result.buildingIncome < 0) {
    verdict =
      'Warnung: Bodenwertverzinsung liegt über dem Reinertrag. Ertragswertverfahren kritisch prüfen.';
  } else if (result.valueGap < -100000) {
    verdict =
      'Kaufpreis inkl. Nebenkosten liegt deutlich über dem Ertragswert. Nur mit Abschlag oder Zusatzpotenzial interessant.';
  } else if (result.valueGap > 100000) {
    verdict =
      'Ertragswert liegt deutlich über Kaufpreis inkl. Nebenkosten. Wirtschaftlich interessant, Risiken prüfen.';
  }
  setText('verdict', verdict);

  window.currentSummary = buildSummary(data, result);
}

function buildSummary(data, result) {
  return `# Kurzbewertung ${data.objectName}\n\nErtragswert: ${euro(result.incomeValue)}\nZiel-Angebot: ${euro(result.targetOffer)}\nBodenwert: ${euro(result.landValue)}\nJahresrohertrag: ${euro(result.grossIncome)}\nLiegenschaftszins: ${data.propertyYield.toFixed(2)} %\nRND: ${data.remainingLife} Jahre\nModernisierungspunkte: ${modernizationPoints()} / 20\nWGFZ-Korrektur: ${data.wgfz ? data.wgfz.wgfzFactor.toFixed(3) : '–'}\n`;
}

function loadCase(data) {
  const merged = { ...DEFAULT_CASE, ...data };
  if (!merged.valuationDate || merged.valuationDate === '2024-01-08')
    merged.valuationDate = todayIsoDate();

  Object.entries(merged).forEach(([key, value]) => {
    if (!['units', 'brwHistory', 'modernization'].includes(key)) setValue(key, value);
  });

  units = merged.units?.length
    ? merged.units
    : [{ name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 }];
  brwHistory = merged.brwHistory || [];
  modernization = { ...DEFAULT_MODERNIZATION, ...(merged.modernization || {}) };

  renderUnits();
  renderBrwHistory();
  renderModernization();
  injectWgfzBlock();
  update();
}

function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function encodedAddress() {
  return encodeURIComponent(textValue('borisAddress') || textValue('objectName') || 'Stuttgart');
}

document.addEventListener('input', (event) => {
  const target = event.target;
  const unitIndex = target.dataset.unitIndex;
  const unitField = target.dataset.unitField;
  const historyIndex = target.dataset.historyIndex;
  const historyField = target.dataset.historyField;
  const modernizationId = target.dataset.modernizationId;

  if (unitField !== undefined) {
    units[unitIndex][unitField] =
      target.type === 'number' ? numberValueFromElement(target) : target.value;
    updateUnitIncome(unitIndex);
  }
  if (historyField !== undefined)
    brwHistory[historyIndex][historyField] = numberValueFromElement(target);
  if (modernizationId !== undefined) {
    modernization[modernizationId] = numberValueFromElement(target);
    updateModernizationDisplay();
  }
  update();
});

document.addEventListener('change', (event) => {
  const target = event.target;
  const unitIndex = target.dataset.unitIndex;
  const unitField = target.dataset.unitField;

  if (unitField === 'rentMode') {
    units[unitIndex][unitField] = target.value;
    updateUnitIncome(unitIndex);
    update();
  }
});

document.addEventListener('click', (event) => {
  const removeUnit = event.target.dataset.removeUnit;
  const removeHistory = event.target.dataset.removeHistory;

  if (event.target.name === 'propertyYieldOption') {
    setValue('propertyYield', event.target.value);
    setValue('propertyYieldNote', event.target.dataset.yieldNote || '');
    update();
  }

  if (removeUnit !== undefined && units.length > 1) {
    units.splice(Number(removeUnit), 1);
    renderUnits();
    update();
  }

  if (removeHistory !== undefined) {
    brwHistory.splice(Number(removeHistory), 1);
    renderBrwHistory();
    update();
  }
});

document.getElementById('addUnit')?.addEventListener('click', () => {
  units.push({
    name: `Einheit ${units.length + 1}`,
    area: 0,
    rentMode: 'sqm',
    rentPerSqm: 0,
    monthlyRent: 0,
    factor: 1,
  });
  renderUnits();
  update();
});

document.getElementById('addBrwHistory')?.addEventListener('click', () => {
  const year = getYearFromDate(textValue('valuationDate')) - 1;
  brwHistory.push({ year: year - 1 - brwHistory.length, value: 0 });
  renderBrwHistory();
  update();
});

document
  .getElementById('saveCase')
  ?.addEventListener('click', () =>
    localStorage.setItem('immowert-case', JSON.stringify(readCase())),
  );

document.getElementById('resetCase')?.addEventListener('click', () => {
  localStorage.removeItem('immowert-case');
  brwHistory = [];
  units = [
    { name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 },
  ];
  modernization = { ...DEFAULT_MODERNIZATION };
  loadCase({ ...DEFAULT_CASE, valuationDate: todayIsoDate() });
});

document.getElementById('copySummary')?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.currentSummary || '');
});

document
  .getElementById('openBoris')
  ?.addEventListener('click', () =>
    openExternal(`https://www.google.com/search?q=${encodedAddress()}+BORIS-BW+Bodenrichtwert`),
  );
document
  .getElementById('openGeoportal')
  ?.addEventListener('click', () =>
    openExternal(
      `https://www.google.com/search?q=${encodedAddress()}+Geoportal+Stuttgart+Bodenrichtwert`,
    ),
  );

const savedCase = localStorage.getItem('immowert-case');
loadCase(savedCase ? JSON.parse(savedCase) : { ...DEFAULT_CASE, valuationDate: todayIsoDate() });
