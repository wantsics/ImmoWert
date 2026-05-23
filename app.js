function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_CASE = {
  objectName: 'Neues Objekt',
  valuationDate: todayIsoDate(),
  borisAddress: '',
  constructionYear: '',
  totalArea: '',
  baseLandValuePerSqm: '',
  timeAdjustmentFactor: 1,
  landFeatureFactor: 1.0,
  plotArea: '',
  relevantFloorArea: '',
  buildingLandArea: '',
  gardenArea: 0,
  gardenFactor: 0.10,
  operatingCostRate: 12.58,
  propertyYield: 1.5,
  remainingLife: 40,
  marketAdjustment: 0,
  bogDeductions: 0,
  bogAdditions: 0,
  purchasePrice: '',
  purchaseCostsRate: 10,
  negotiationBuffer: 5
};

let brwHistory = [];
let units = [
  { name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 }
];

function numberValue(id) {
  const element = document.getElementById(id);
  if (!element) return 0;
  return parseFloat(String(element.value).replace(',', '.')) || 0;
}

function textValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : '';
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? '';
}

function euro(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

function percent(value) {
  return `${(value || 0).toFixed(2)} %`;
}

function getYearFromDate(dateString) {
  const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date();
  return Number.isFinite(date.getFullYear()) ? date.getFullYear() : new Date().getFullYear();
}

function calculateBrwTimeFactor(currentBrw, valuationYear) {
  const currentYear = valuationYear - 1;
  const historyByYear = new Map();

  brwHistory
    .map(point => ({ year: Number(point.year), value: Number(point.value) }))
    .filter(point => point.year > 0 && point.value > 0 && point.year !== currentYear)
    .forEach(point => historyByYear.set(point.year, point.value));

  if (!currentBrw || historyByYear.size === 0) {
    return { factor: 1, info: 'BRW-Zeitfaktor: keine auswertbare Historie angegeben, daher Faktor 1,00.' };
  }

  const allPoints = [
    ...Array.from(historyByYear, ([year, value]) => ({ year, value })),
    { year: currentYear, value: currentBrw }
  ].sort((a, b) => a.year - b.year);

  const first = allPoints[0];
  const last = allPoints[allPoints.length - 1];
  const yearSpan = last.year - first.year;

  if (yearSpan <= 0) {
    return { factor: 1, info: 'BRW-Zeitfaktor: Historie nicht auswertbar, daher Faktor 1,00.' };
  }

  const yearlyTrend = (last.value - first.value) / yearSpan;
  const targetValue = currentBrw + yearlyTrend * (valuationYear - currentYear);
  const factor = targetValue > 0 ? targetValue / currentBrw : 1;

  return {
    factor,
    info: `BRW-Zeitfaktor: aktueller BRW ${currentYear} = ${euro(currentBrw)}/m²; Trend aus ${first.year} (${euro(first.value)}/m²) bis ${last.year} (${euro(last.value)}/m²); Zieljahr ${valuationYear} → ${euro(targetValue)}/m²; Faktor ${factor.toFixed(3)}.`
  };
}

function calculateCapitalizationFactor(propertyYieldPercent, remainingLifeYears) {
  const p = propertyYieldPercent / 100;
  const n = remainingLifeYears;
  if (n <= 0) return 0;
  if (p <= 0) return n;
  const q = 1 + p;
  return (Math.pow(q, n) - 1) / (Math.pow(q, n) * p);
}

function unitAnnualIncome(unit) {
  if (unit.rentMode === 'monthly') {
    return (Number(unit.monthlyRent) || 0) * 12 * ((Number(unit.factor) || 0));
  }
  return (Number(unit.area) || 0) * (Number(unit.rentPerSqm) || 0) * 12 * ((Number(unit.factor) || 0));
}

function readCase() {
  const valuationYear = getYearFromDate(textValue('valuationDate'));
  const brwFactor = calculateBrwTimeFactor(numberValue('baseLandValuePerSqm'), valuationYear);
  setValue('timeAdjustmentFactor', brwFactor.factor.toFixed(3));
  setText('brwTrendInfo', brwFactor.info);

  return {
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
    remainingLife: numberValue('remainingLife'),
    marketAdjustment: numberValue('marketAdjustment'),
    bogDeductions: numberValue('bogDeductions'),
    bogAdditions: numberValue('bogAdditions'),
    purchasePrice: numberValue('purchasePrice'),
    purchaseCostsRate: numberValue('purchaseCostsRate'),
    negotiationBuffer: numberValue('negotiationBuffer'),
    units,
    brwHistory
  };
}

function calculate(data) {
  const actualWgfz = data.plotArea > 0 && data.relevantFloorArea > 0 ? data.relevantFloorArea / data.plotArea : 0;
  const adjustedBrw = data.baseLandValuePerSqm * data.timeAdjustmentFactor * data.landFeatureFactor;
  const buildingLandValue = adjustedBrw * data.buildingLandArea;
  const gardenLandValue = adjustedBrw * data.gardenArea * data.gardenFactor;
  const landValue = buildingLandValue + gardenLandValue;
  const grossIncome = data.units.reduce((sum, unit) => sum + unitAnnualIncome(unit), 0);
  const operatingCosts = grossIncome * data.operatingCostRate / 100;
  const netIncome = grossIncome - operatingCosts;
  const landInterest = landValue * data.propertyYield / 100;
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
  const grossYield = data.purchasePrice > 0 ? grossIncome / data.purchasePrice * 100 : 0;
  const netYield = data.purchasePrice > 0 ? netIncome / data.purchasePrice * 100 : 0;
  return { actualWgfz, adjustedBrw, buildingLandValue, gardenLandValue, landValue, grossIncome, operatingCosts, netIncome, landInterest, buildingIncome, multiplier, buildingValue, preliminaryIncomeValue, marketAdjustedValue, bogTotal, incomeValue, targetOffer, totalAcquisitionCost, valueGap, rentMultiplier, grossYield, netYield };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderUnits() {
  const container = document.getElementById('unitsContainer');
  if (!container) return;
  container.innerHTML = units.map((unit, index) => `
    <div class="unit-card">
      <div class="unit-head">
        <strong>${unit.name || `Einheit ${index + 1}`}</strong>
        <button type="button" data-remove-unit="${index}" ${units.length === 1 ? 'disabled' : ''}>Entfernen</button>
      </div>
      <div class="grid three compact-grid">
        <label>Name<input data-unit-field="name" data-unit-index="${index}" value="${unit.name || ''}" /></label>
        <label>Fläche<input type="number" data-unit-field="area" data-unit-index="${index}" value="${unit.area || 0}" min="0" step="1" /><small>m²</small></label>
        <label>Mietmodus<select data-unit-field="rentMode" data-unit-index="${index}"><option value="sqm" ${unit.rentMode === 'sqm' ? 'selected' : ''}>€/m²</option><option value="monthly" ${unit.rentMode === 'monthly' ? 'selected' : ''}>Monatsmiete</option></select></label>
        <label>Miete €/m²<input type="number" data-unit-field="rentPerSqm" data-unit-index="${index}" value="${unit.rentPerSqm || 0}" min="0" step="0.1" /></label>
        <label>Monatsmiete<input type="number" data-unit-field="monthlyRent" data-unit-index="${index}" value="${unit.monthlyRent || 0}" min="0" step="10" /></label>
        <label>Faktor<input type="number" data-unit-field="factor" data-unit-index="${index}" value="${unit.factor || 1}" min="0" step="0.1" /></label>
      </div>
      <small>Jahresrohertrag: ${euro(unitAnnualIncome(unit))}</small>
    </div>
  `).join('');
}

function renderBrwHistory() {
  const container = document.getElementById('brwHistoryContainer');
  if (!container) return;
  container.innerHTML = brwHistory.map((point, index) => `
    <div class="history-row">
      <label>Jahr<input type="number" data-history-field="year" data-history-index="${index}" value="${point.year || ''}" min="1900" max="2100" step="1" /></label>
      <label>BRW<input type="number" data-history-field="value" data-history-index="${index}" value="${point.value || ''}" min="0" step="10" /></label>
      <button type="button" data-remove-history="${index}">Entfernen</button>
    </div>
  `).join('');
}

function update() {
  const data = readCase();
  const result = calculate(data);
  setValue('actualWgfz', result.actualWgfz ? result.actualWgfz.toFixed(2) : '');
  setValue('unitCountDisplay', data.units.length);

  setText('headlineValue', euro(result.incomeValue));
  setText('headlineMeta', `${data.objectName} · ${data.valuationDate}`);
  setText('objectSummary', `${data.borisAddress || 'keine Adresse'} · ${data.totalArea || 0} m²`);
  setText('landSummary', euro(result.landValue));
  setText('incomeSummary', `${euro(result.grossIncome)} / Jahr`);
  setText('modelSummary', `LZ ${data.propertyYield.toFixed(2)} % · RND ${data.remainingLife} J.`);
  setText('bogSummary', euro(result.bogTotal));
  setText('purchaseSummary', `Ziel ${euro(result.targetOffer)}`);

  setText('adjustedBrw', `${euro(result.adjustedBrw)} / m²`);
  setText('landValue', euro(result.landValue));
  setText('grossIncome', euro(result.grossIncome));
  setText('operatingCosts', euro(result.operatingCosts));
  setText('netIncome', euro(result.netIncome));
  setText('landInterest', euro(result.landInterest));
  setText('buildingIncome', euro(result.buildingIncome));
  setText('multiplier', result.multiplier.toFixed(3));
  setText('buildingValue', euro(result.buildingValue));
  setText('preliminaryIncomeValue', euro(result.preliminaryIncomeValue));
  setText('bogTotal', euro(result.bogTotal));
  setText('incomeValue', euro(result.incomeValue));
  setText('targetOffer', euro(result.targetOffer));
  setText('totalAcquisitionCost', euro(result.totalAcquisitionCost));
  setText('valueGap', euro(result.valueGap));
  setText('rentMultiplier', `${result.rentMultiplier.toFixed(1)}x`);
  setText('grossYield', percent(result.grossYield));
  setText('netYield', percent(result.netYield));

  let verdict = 'Neutral. Die Parameter prüfen und mit Marktbericht/Gutachten abgleichen.';
  if (result.buildingIncome < 0) verdict = 'Warnung: Bodenwertverzinsung liegt über dem Reinertrag. Ertragswertverfahren kritisch prüfen.';
  else if (result.valueGap < -100000) verdict = 'Kaufpreis inkl. Nebenkosten liegt deutlich über dem Ertragswert. Nur mit Abschlag oder Zusatzpotenzial interessant.';
  else if (result.valueGap > 100000) verdict = 'Ertragswert liegt deutlich über Kaufpreis inkl. Nebenkosten. Wirtschaftlich interessant, Risiken prüfen.';
  setText('verdict', verdict);
  window.currentSummary = buildSummary(data, result);
}

function buildSummary(data, result) {
  return `# Kurzbewertung ${data.objectName}\n\nErtragswert: ${euro(result.incomeValue)}\nZiel-Angebot: ${euro(result.targetOffer)}\nBodenwert: ${euro(result.landValue)}\nJahresrohertrag: ${euro(result.grossIncome)}\nLiegenschaftszins: ${data.propertyYield.toFixed(2)} %\nRND: ${data.remainingLife} Jahre\n`;
}

function loadCase(data) {
  const merged = { ...DEFAULT_CASE, ...data };
  if (!merged.valuationDate || merged.valuationDate === '2024-01-08') merged.valuationDate = todayIsoDate();
  Object.entries(merged).forEach(([key, value]) => {
    if (!['units', 'brwHistory'].includes(key)) setValue(key, value);
  });
  units = merged.units?.length ? merged.units : [{ name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 }];
  brwHistory = merged.brwHistory || [];
  renderUnits();
  renderBrwHistory();
  update();
}

function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function encodedAddress() {
  return encodeURIComponent(textValue('borisAddress') || textValue('objectName') || 'Stuttgart');
}

document.addEventListener('input', event => {
  const unitIndex = event.target.dataset.unitIndex;
  const unitField = event.target.dataset.unitField;
  const historyIndex = event.target.dataset.historyIndex;
  const historyField = event.target.dataset.historyField;

  if (unitField !== undefined) {
    units[unitIndex][unitField] = event.target.type === 'number' ? numberValueFromElement(event.target) : event.target.value;
    renderUnits();
  }
  if (historyField !== undefined) {
    brwHistory[historyIndex][historyField] = numberValueFromElement(event.target);
  }
  update();
});

function numberValueFromElement(element) {
  return parseFloat(String(element.value).replace(',', '.')) || 0;
}

document.addEventListener('click', event => {
  const removeUnit = event.target.dataset.removeUnit;
  const removeHistory = event.target.dataset.removeHistory;
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
  units.push({ name: `Einheit ${units.length + 1}`, area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 });
  renderUnits();
  update();
});

document.getElementById('addBrwHistory')?.addEventListener('click', () => {
  const valuationYear = getYearFromDate(textValue('valuationDate'));
  const currentBrwYear = valuationYear - 1;
  brwHistory.push({ year: currentBrwYear - 1 - brwHistory.length, value: 0 });
  renderBrwHistory();
  update();
});

document.getElementById('saveCase')?.addEventListener('click', () => {
  localStorage.setItem('immowert-case', JSON.stringify(readCase()));
});

document.getElementById('resetCase')?.addEventListener('click', () => {
  localStorage.removeItem('immowert-case');
  brwHistory = [];
  units = [{ name: 'Einheit 1', area: 0, rentMode: 'sqm', rentPerSqm: 0, monthlyRent: 0, factor: 1 }];
  loadCase({ ...DEFAULT_CASE, valuationDate: todayIsoDate() });
});

document.getElementById('copySummary')?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.currentSummary || '');
});

document.getElementById('openBoris')?.addEventListener('click', () => {
  openExternal(`https://www.google.com/search?q=${encodedAddress()}+BORIS-BW+Bodenrichtwert`);
});

document.getElementById('openGeoportal')?.addEventListener('click', () => {
  openExternal(`https://www.google.com/search?q=${encodedAddress()}+Geoportal+Stuttgart+Bodenrichtwert`);
});

const savedCase = localStorage.getItem('immowert-case');
loadCase(savedCase ? JSON.parse(savedCase) : { ...DEFAULT_CASE, valuationDate: todayIsoDate() });
