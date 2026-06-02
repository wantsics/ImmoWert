const VERSION = 'V0.2.9';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

let profiles = [];
let installed = false;
let updateWrapped = false;

function $(id) {
  return document.getElementById(id);
}

function numValue(id) {
  return parseFloat(String($(id)?.value || '').replace(',', '.')) || 0;
}

function setValue(id, value) {
  const element = $(id);
  if (element) element.value = value ?? '';
}

function money(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function numberText(value, digits = 3) {
  return (Number(value) || 0).toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function percent(value) {
  return `${(Number(value) || 0).toFixed(2)} %`;
}

function parseEuro(text) {
  const cleaned = String(text || '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value ?? '–';
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

async function loadProfiles() {
  try {
    const local = localStorage.getItem('immowert-market-profiles');
    profiles = local ? JSON.parse(local) : [];
  } catch {
    profiles = [];
  }

  if (profiles.length) return;

  try {
    const response = await fetch('market-profiles.json', { cache: 'no-store' });
    profiles = response.ok ? await response.json() : [];
  } catch {
    profiles = [];
  }
}

function activeProfile() {
  const selectedId = $('marketProfileSelect')?.value || localStorage.getItem('immowert-active-market-profile');
  return profiles.find((profile) => profile.id === selectedId) || profiles[0] || null;
}

function correctionList(profile) {
  const direct = profile?.landValue?.corrections;
  if (Array.isArray(direct)) return direct;

  const legacy = [];

  if (profile?.landValue?.model === 'wgfz' || profile?.landValue?.tables) {
    legacy.push({ id: 'wgfz', type: 'wgfz', enabled: true, label: 'WGFZ-Korrektur' });
  }

  if (profile?.comparisonValue?.efhZfhPlotSizeFactor) {
    legacy.push({
      id: 'reference_area',
      type: 'range_table_factor',
      enabled: true,
      label: 'Referenzflächenkorrektur',
      input: 'plotArea',
      table: profile.comparisonValue.efhZfhPlotSizeFactor,
      source: 'comparisonValue.efhZfhPlotSizeFactor',
      note: profile.comparisonValue.note || 'Grundstücksgrößenfaktor aus Marktprofil.',
    });
  }

  legacy.push({
    id: 'manual',
    type: 'manual_factor',
    enabled: true,
    label: 'Manueller Lage-/Objektfaktor',
  });

  return legacy;
}

function correction(profile, id) {
  return correctionList(profile).find((item) => item.id === id || item.type === id) || null;
}

function lookupRangeFactor(table, value) {
  const numeric = Number(value) || 0;
  if (!Array.isArray(table) || !numeric) {
    return { factor: 1, row: null, info: 'keine auswertbare Tabelle oder Eingabefläche' };
  }

  const row = table.find(([min, max]) => numeric >= Number(min || 0) && (max == null || numeric <= Number(max)));
  if (!row) {
    return { factor: 1, row: null, info: `keine Tabellenzeile für ${numberText(numeric, 0)} m²` };
  }

  const [min, max, factor] = row;
  const range = max == null ? `ab ${numberText(min, 0)} m²` : `${numberText(min, 0)}–${numberText(max, 0)} m²`;
  return {
    factor: Number(factor) || 1,
    row,
    info: `${range} → Faktor ${numberText(factor, 3)}`,
  };
}

function setDisabled(id, disabled, hint = '') {
  const element = $(id);
  const label = element?.closest('label');
  if (!element) return;
  element.disabled = disabled;
  if (label) {
    label.classList.toggle('profile-disabled', disabled);
    label.title = hint;
  }
}

function applyWgfzAvailability(profile) {
  const hasWgfz = !!correction(profile, 'wgfz') || profile?.landValue?.model === 'wgfz';
  const active = $('wgfzActive');

  if (active) {
    active.checked = hasWgfz;
    active.disabled = !hasWgfz;
  }

  ['wgfzModel', 'wgfzSoll', 'wgfzIst', 'wgfzReferenceCoeff', 'wgfzTargetCoeff', 'wgfzCorrectionFactor', 'wgfzExtrapolate'].forEach(
    (id) => setDisabled(id, !hasWgfz, hasWgfz ? '' : 'Im aktiven Marktprofil keine WGFZ-Korrektur definiert.'),
  );

  if (!hasWgfz) {
    setValue('wgfzCorrectionFactor', '1.000');
    const info = $('wgfzInfo');
    if (info) info.textContent = 'WGFZ-Korrektur: im aktiven Marktprofil nicht definiert. Faktor 1,000.';
  }
}

function applyReferenceAvailability(profile) {
  const ref = correction(profile, 'reference_area') || correction(profile, 'range_table_factor');
  const hasReference = !!ref;

  setDisabled(
    'referencePlotSize',
    !hasReference,
    hasReference ? '' : 'Im aktiven Marktprofil keine Referenzflächenkorrektur definiert.',
  );

  const factorInput = $('referenceAreaFactor');
  const block = $('referenceFactorBlock');
  const herleitung = block?.querySelector('input[readonly]:not(#referenceAreaFactor)');

  if (!hasReference) {
    if (factorInput) factorInput.value = '1.000';
    if (herleitung) herleitung.value = 'Im aktiven Marktprofil nicht verfügbar. Faktor 1,000.';
    return 1;
  }

  const inputId = ref.input || 'plotArea';
  const inputValue = numValue(inputId);
  const result = lookupRangeFactor(ref.table, inputValue);

  if (factorInput) factorInput.value = result.factor.toFixed(3);
  if (herleitung) {
    herleitung.value = `${ref.label || 'Referenzfläche'}: ${inputId} ${numberText(inputValue, 0)} m²; ${result.info}`;
  }

  const referenceInput = $('referencePlotSize');
  if (referenceInput && !referenceInput.value && result.row) {
    const [min, max] = result.row;
    referenceInput.placeholder = max == null ? `ab ${numberText(min, 0)} m²` : `${numberText(min, 0)}–${numberText(max, 0)} m²`;
  }

  return result.factor;
}

function capitalizationFactor(yieldPercent, years) {
  const p = (Number(yieldPercent) || 0) / 100;
  const n = Number(years) || 0;
  if (n <= 0) return 0;
  if (p <= 0) return n;
  const qn = (1 + p) ** n;
  return (qn - 1) / (qn * p);
}

function applyGenericLandValue() {
  const profile = activeProfile();
  setVersionLabel();
  applyWgfzAvailability(profile);
  const referenceFactor = applyReferenceAvailability(profile);

  const automaticBrw = numValue('automaticBrwPerSqm') || numValue('baseLandValuePerSqm') * (numValue('timeAdjustmentFactor') || 1);
  const manualFactor = numValue('manualLocationFactor') || 1;
  const wgfzActive = $('wgfzActive')?.checked;
  const wgfzFactor = wgfzActive ? numValue('wgfzCorrectionFactor') || 1 : 1;
  const correctionFactor = manualFactor * wgfzFactor * referenceFactor;
  const weightedArea = numValue('buildingLandArea') + numValue('gardenArea') * (numValue('gardenFactor') || 0);
  const beitragsfrei = automaticBrw * correctionFactor;
  const landValue = beitragsfrei * weightedArea;

  setValue('landFeatureFactor', correctionFactor.toFixed(3));

  const grossIncome = parseEuro($('grossIncome')?.textContent);
  const operatingCosts = parseEuro($('operatingCosts')?.textContent);
  const netIncome = grossIncome - operatingCosts;
  const propertyYield = numValue('propertyYield');
  const landInterest = (landValue * propertyYield) / 100;
  const buildingIncome = netIncome - landInterest;
  const multiplier = capitalizationFactor(propertyYield, numValue('remainingLife'));
  const buildingValue = buildingIncome * multiplier;
  const preliminaryIncomeValue = buildingValue + landValue;
  const marketAdjustedValue = preliminaryIncomeValue * (1 + numValue('marketAdjustment') / 100);
  const bogTotal = numValue('bogAdditions') - numValue('bogDeductions');
  const incomeValue = marketAdjustedValue + bogTotal;
  const targetOffer = incomeValue * (1 - numValue('negotiationBuffer') / 100);
  const totalAcquisitionCost = numValue('purchasePrice') * (1 + numValue('purchaseCostsRate') / 100);
  const valueGap = incomeValue - totalAcquisitionCost;
  const rentMultiplier = grossIncome > 0 ? numValue('purchasePrice') / grossIncome : 0;
  const grossYield = numValue('purchasePrice') > 0 ? (grossIncome / numValue('purchasePrice')) * 100 : 0;
  const netYield = numValue('purchasePrice') > 0 ? (netIncome / numValue('purchasePrice')) * 100 : 0;

  setText('adjustedBrw', `${money(beitragsfrei)} / m²`);
  setText('landValue', money(landValue));
  setText('landInterest', money(landInterest));
  setText('buildingIncome', money(buildingIncome));
  setText('multiplier', multiplier.toFixed(3));
  setText('buildingValue', money(buildingValue));
  setText('preliminaryIncomeValue', money(preliminaryIncomeValue));
  setText('bogTotal', money(bogTotal));
  setText('incomeValue', money(incomeValue));
  setText('targetOffer', money(targetOffer));
  setText('totalAcquisitionCost', money(totalAcquisitionCost));
  setText('valueGap', money(valueGap));
  setText('rentMultiplier', `${rentMultiplier.toFixed(1)}x`);
  setText('grossYield', percent(grossYield));
  setText('netYield', percent(netYield));
  setText('headlineValue', money(incomeValue));

  const landSummary = $('landSummary');
  if (landSummary) {
    landSummary.textContent = `BRW ${automaticBrw ? `${money(automaticBrw)}/m²` : 'offen'} · Faktor ${numberText(correctionFactor, 3)} · beitragsfrei ${money(beitragsfrei)}/m² · Fläche ${numberText(weightedArea, 0)} m² · Bodenwert ${money(landValue)}`;
  }

  const factorsSummary = $('workflowFactorsSubsection')?.querySelector('[data-workflow-summary]');
  if (factorsSummary) factorsSummary.textContent = `Faktor ${numberText(correctionFactor, 3)} · manuell ${numberText(manualFactor, 3)} · WGFZ ${numberText(wgfzFactor, 3)} · Ref ${numberText(referenceFactor, 3)}`;

  const profileInfo = $('marketProfileInfo');
  if (profileInfo && profile) {
    const activeCorrections = correctionList(profile)
      .map((item) => item.label || item.id || item.type)
      .join(' · ');
    profileInfo.innerHTML += `<br>Korrekturmodell: ${activeCorrections || 'nur Standardfaktoren 1,000'}`;
  }
}

function wrapUpdate() {
  if (updateWrapped || typeof window.update !== 'function') return;
  updateWrapped = true;
  const originalUpdate = window.update;
  window.update = function wrappedUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    window.setTimeout(applyGenericLandValue, 0);
    return result;
  };
}

function installGenericLandModel() {
  if (installed) return;
  installed = true;

  loadProfiles().then(() => {
    wrapUpdate();
    [0, 100, 300, 800, 1500, 3000].forEach((delay) => window.setTimeout(applyGenericLandValue, delay));
  });

  document.addEventListener('input', () => window.setTimeout(applyGenericLandValue, 0));
  document.addEventListener('change', () => window.setTimeout(applyGenericLandValue, 0));
  document.addEventListener('click', (event) => {
    if (event.target?.id === 'resetProfiles') {
      window.setTimeout(() => loadProfiles().then(applyGenericLandValue), 300);
    }
  });
}

installGenericLandModel();
