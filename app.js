const DEFAULT_CASE = {
  objectName: 'Wurmlingerstraße 24 – Gutachten-Referenz',
  valuationDate: '2024-01-08',
  baseLandValuePerSqm: 2300,
  timeAdjustmentFactor: 0.98,
  landFeatureFactor: 1.0,
  buildingLandArea: 411,
  gardenArea: 0,
  gardenFactor: 0.10,
  unit1Area: 98,
  unit1Rent: 11.5,
  unit1Factor: 1,
  unit2Area: 141,
  unit2Rent: 14,
  unit2Factor: 1,
  operatingCostRate: 12.58,
  propertyYield: 1.5,
  remainingLife: 24,
  marketAdjustment: 0,
  bogDeductions: 0,
  bogAdditions: 129810,
  purchasePrice: 1330000,
  purchaseCostsRate: 10,
  negotiationBuffer: 5
};

const fields = Array.from(document.querySelectorAll('input'));

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
  if (element) element.value = value;
}

function euro(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function percent(value) {
  return `${(value || 0).toFixed(2)} %`;
}

function calculateCapitalizationFactor(propertyYieldPercent, remainingLifeYears) {
  const p = propertyYieldPercent / 100;
  const n = remainingLifeYears;

  if (n <= 0) return 0;
  if (p <= 0) return n;

  const q = 1 + p;
  return (Math.pow(q, n) - 1) / (Math.pow(q, n) * p);
}

function readCase() {
  return {
    objectName: textValue('objectName'),
    valuationDate: textValue('valuationDate'),
    baseLandValuePerSqm: numberValue('baseLandValuePerSqm'),
    timeAdjustmentFactor: numberValue('timeAdjustmentFactor'),
    landFeatureFactor: numberValue('landFeatureFactor'),
    buildingLandArea: numberValue('buildingLandArea'),
    gardenArea: numberValue('gardenArea'),
    gardenFactor: numberValue('gardenFactor'),
    unit1Area: numberValue('unit1Area'),
    unit1Rent: numberValue('unit1Rent'),
    unit1Factor: numberValue('unit1Factor'),
    unit2Area: numberValue('unit2Area'),
    unit2Rent: numberValue('unit2Rent'),
    unit2Factor: numberValue('unit2Factor'),
    operatingCostRate: numberValue('operatingCostRate'),
    propertyYield: numberValue('propertyYield'),
    remainingLife: numberValue('remainingLife'),
    marketAdjustment: numberValue('marketAdjustment'),
    bogDeductions: numberValue('bogDeductions'),
    bogAdditions: numberValue('bogAdditions'),
    purchasePrice: numberValue('purchasePrice'),
    purchaseCostsRate: numberValue('purchaseCostsRate'),
    negotiationBuffer: numberValue('negotiationBuffer')
  };
}

function loadCase(data) {
  Object.entries(data).forEach(([key, value]) => setValue(key, value));
  update();
}

function calculate(data) {
  const adjustedBrw = data.baseLandValuePerSqm * data.timeAdjustmentFactor * data.landFeatureFactor;
  const buildingLandValue = adjustedBrw * data.buildingLandArea;
  const gardenLandValue = adjustedBrw * data.gardenArea * data.gardenFactor;
  const landValue = buildingLandValue + gardenLandValue;

  const unit1GrossIncome = data.unit1Area * data.unit1Rent * 12 * data.unit1Factor;
  const unit2GrossIncome = data.unit2Area * data.unit2Rent * 12 * data.unit2Factor;
  const grossIncome = unit1GrossIncome + unit2GrossIncome;

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

  return {
    adjustedBrw,
    buildingLandValue,
    gardenLandValue,
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
    netYield
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function update() {
  const data = readCase();
  const result = calculate(data);

  setText('headlineValue', euro(result.incomeValue));
  setText('headlineMeta', `${data.objectName} · ${data.valuationDate}`);

  setText('adjustedBrw', `${euro(result.adjustedBrw)} / m²`);
  setText('buildingLandValue', euro(result.buildingLandValue));
  setText('gardenLandValue', euro(result.gardenLandValue));
  setText('landValue', euro(result.landValue));
  setText('grossIncome', euro(result.grossIncome));
  setText('operatingCosts', euro(result.operatingCosts));
  setText('netIncome', euro(result.netIncome));
  setText('landInterest', euro(result.landInterest));
  setText('buildingIncome', euro(result.buildingIncome));
  setText('multiplier', result.multiplier.toFixed(3));
  setText('buildingValue', euro(result.buildingValue));
  setText('preliminaryIncomeValue', euro(result.preliminaryIncomeValue));
  setText('marketAdjustedValue', euro(result.marketAdjustedValue));
  setText('bogTotal', euro(result.bogTotal));
  setText('incomeValue', euro(result.incomeValue));
  setText('targetOffer', euro(result.targetOffer));
  setText('totalAcquisitionCost', euro(result.totalAcquisitionCost));
  setText('valueGap', euro(result.valueGap));
  setText('rentMultiplier', `${result.rentMultiplier.toFixed(1)}x`);
  setText('grossYield', percent(result.grossYield));
  setText('netYield', percent(result.netYield));

  let verdict = 'Neutral. Die Parameter prüfen und mit Marktbericht/Gutachten abgleichen.';
  if (result.buildingIncome < 0) {
    verdict = 'Warnung: Bodenwertverzinsung liegt über dem Reinertrag. Ertragswertverfahren kritisch prüfen.';
  } else if (result.valueGap < -100000) {
    verdict = 'Kaufpreis inkl. Nebenkosten liegt deutlich über dem Ertragswert. Nur mit Abschlag oder Zusatzpotenzial interessant.';
  } else if (result.valueGap > 100000) {
    verdict = 'Ertragswert liegt deutlich über Kaufpreis inkl. Nebenkosten. Wirtschaftlich interessant, Risiken prüfen.';
  }
  setText('verdict', verdict);

  window.currentSummary = buildSummary(data, result);
}

function buildSummary(data, result) {
  return `# Kurzbewertung ${data.objectName}\n\n` +
    `Bewertungsstichtag: ${data.valuationDate}\n\n` +
    `## Ertragswertverfahren\n` +
    `- Angepasster BRW: ${euro(result.adjustedBrw)} / m²\n` +
    `- Bodenwert: ${euro(result.landValue)}\n` +
    `- Jahresrohertrag: ${euro(result.grossIncome)}\n` +
    `- Bewirtschaftungskosten: ${euro(result.operatingCosts)}\n` +
    `- Jahresreinertrag: ${euro(result.netIncome)}\n` +
    `- Liegenschaftszins: ${data.propertyYield.toFixed(2)} %\n` +
    `- Restnutzungsdauer: ${data.remainingLife} Jahre\n` +
    `- Kapitalisierungsfaktor: ${result.multiplier.toFixed(3)}\n` +
    `- boG saldiert: ${euro(result.bogTotal)}\n` +
    `- Ertragswert: ${euro(result.incomeValue)}\n\n` +
    `## Ankauf\n` +
    `- Ziel-Angebot: ${euro(result.targetOffer)}\n` +
    `- Kaufpreisforderung inkl. Nebenkosten: ${euro(result.totalAcquisitionCost)}\n` +
    `- Differenz: ${euro(result.valueGap)}\n`;
}

fields.forEach(field => field.addEventListener('input', update));

document.getElementById('saveCase')?.addEventListener('click', () => {
  localStorage.setItem('immowert-case', JSON.stringify(readCase()));
  update();
});

document.getElementById('resetCase')?.addEventListener('click', () => {
  localStorage.removeItem('immowert-case');
  loadCase(DEFAULT_CASE);
});

document.getElementById('copySummary')?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.currentSummary || '');
});

const savedCase = localStorage.getItem('immowert-case');
loadCase(savedCase ? JSON.parse(savedCase) : DEFAULT_CASE);
