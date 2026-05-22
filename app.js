const fields = document.querySelectorAll('input');

function euro(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function percent(value) {
  return `${value.toFixed(2)} %`;
}

function calculateMultiplier(i, n) {
  const factor = i / 100;

  if (factor <= 0) {
    return n;
  }

  return (Math.pow(1 + factor, n) - 1) / (factor * Math.pow(1 + factor, n));
}

function update() {
  const grossRent = parseFloat(document.getElementById('grossRent').value) || 0;
  const operatingCosts = parseFloat(document.getElementById('operatingCosts').value) || 0;
  const landValue = parseFloat(document.getElementById('landValue').value) || 0;
  const propertyYield = parseFloat(document.getElementById('propertyYield').value) || 0;
  const remainingLife = parseFloat(document.getElementById('remainingLife').value) || 0;
  const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
  const purchaseCostsRate = parseFloat(document.getElementById('purchaseCostsRate').value) || 0;
  const riskDiscount = parseFloat(document.getElementById('riskDiscount').value) || 0;

  const netIncome = grossRent - operatingCosts;
  const landInterest = landValue * (propertyYield / 100);
  const buildingIncome = netIncome - landInterest;

  const multiplier = calculateMultiplier(propertyYield, remainingLife);

  const buildingValue = buildingIncome * multiplier;
  const incomeValue = buildingValue + landValue;

  const riskAdjustedValue = incomeValue * (1 - riskDiscount / 100);

  const totalAcquisitionCost = purchasePrice * (1 + purchaseCostsRate / 100);

  const valueGap = riskAdjustedValue - totalAcquisitionCost;

  const rentMultiplier = grossRent > 0
    ? totalAcquisitionCost / grossRent
    : 0;

  const grossYield = totalAcquisitionCost > 0
    ? (grossRent / totalAcquisitionCost) * 100
    : 0;

  const netYield = totalAcquisitionCost > 0
    ? (netIncome / totalAcquisitionCost) * 100
    : 0;

  document.getElementById('headlineValue').textContent = euro(riskAdjustedValue);

  document.getElementById('netIncome').textContent = euro(netIncome);
  document.getElementById('landInterest').textContent = euro(landInterest);
  document.getElementById('buildingIncome').textContent = euro(buildingIncome);
  document.getElementById('multiplier').textContent = multiplier.toFixed(2);
  document.getElementById('buildingValue').textContent = euro(buildingValue);
  document.getElementById('incomeValue').textContent = euro(incomeValue);
  document.getElementById('riskAdjustedValue').textContent = euro(riskAdjustedValue);

  document.getElementById('totalAcquisitionCost').textContent = euro(totalAcquisitionCost);
  document.getElementById('valueGap').textContent = euro(valueGap);
  document.getElementById('rentMultiplier').textContent = `${rentMultiplier.toFixed(1)}x`;
  document.getElementById('grossYield').textContent = percent(grossYield);
  document.getElementById('netYield').textContent = percent(netYield);

  let verdict = 'Neutral bewertet.';

  if (valueGap > 100000) {
    verdict = 'Der kalkulierte Ertragswert liegt deutlich über den Gesamtkosten. Objekt wirkt wirtschaftlich attraktiv.';
  } else if (valueGap < -100000) {
    verdict = 'Der Kaufpreis liegt deutlich über dem kalkulierten Ertragswert. Kritisch prüfen.';
  }

  document.getElementById('verdict').textContent = verdict;
}

fields.forEach(field => {
  field.addEventListener('input', update);
});

update();
