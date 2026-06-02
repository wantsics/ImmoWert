const VERSION = 'V0.2.7';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

function $(id) {
  return document.getElementById(id);
}

function numberValue(id) {
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

function getValuationDate() {
  const raw = $('valuationDate')?.value;
  const date = raw ? new Date(`${raw}T12:00:00`) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function getValuationYear() {
  return getValuationDate().getFullYear();
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function ensureStyle() {
  if ($('brwModelCss')) return;

  const style = document.createElement('style');
  style.id = 'brwModelCss';
  style.textContent = `
    .workflow-ui #automaticBrwPerSqm {
      background: #eef6ff;
      border-color: #7dd3fc;
      color: #075985;
      font-weight: 800;
    }
    .workflow-ui .brw-auto-label {
      grid-column: 1 / -1;
    }
  `;
  document.head.appendChild(style);
}

function labelFor(id) {
  return $(id)?.closest('label') || null;
}

function ensureAutomaticBrwField() {
  if ($('automaticBrwPerSqm')) return;

  const brwLabel = labelFor('baseLandValuePerSqm');
  if (!brwLabel) return;

  const label = document.createElement('label');
  label.className = 'brw-auto-label';
  label.innerHTML = `Automatischer BRW
    <input type="number" id="automaticBrwPerSqm" readonly>
    <small>aus mindestens einer BRW-Zeile; bei Historie linear auf den Stichtag korrigiert</small>`;

  brwLabel.parentNode.insertBefore(label, brwLabel.parentNode.firstChild);
}

function normalizePrimaryLabels() {
  const yearLabel = labelFor('currentBrwYear');
  const brwLabel = labelFor('baseLandValuePerSqm');

  if (yearLabel) {
    const title = yearLabel.querySelector('.field-title');
    if (title) title.textContent = 'Jahr';
    const small = yearLabel.querySelector('small');
    if (small) small.textContent = 'Jahr des BRW aus BORIS/Marktbericht';
  }

  if (brwLabel) {
    const title = brwLabel.querySelector('.field-title');
    if (title) {
      const tooltip = title.querySelector('.info-tooltip');
      title.textContent = 'BRW ';
      if (tooltip) title.appendChild(tooltip);
    }
    const small = brwLabel.querySelector('small');
    if (small) small.textContent = '€/m², aus BORIS/Marktbericht';
  }
}

function historyRows() {
  return Array.from(document.querySelectorAll('#brwHistoryContainer .history-row'))
    .map((row) => ({
      year: Number(row.querySelector('[data-history-field="year"]')?.value) || 0,
      value: Number(row.querySelector('[data-history-field="value"]')?.value) || 0,
    }))
    .filter((point) => point.year > 0 && point.value > 0)
    .sort((a, b) => a.year - b.year);
}

function daysFromCurrentYearStart(currentYear, valuationDate) {
  const start = new Date(`${currentYear}-01-01T12:00:00`);
  return (valuationDate.getTime() - start.getTime()) / 86400000;
}

function calculateAutomaticBrw() {
  const inputBrw = numberValue('baseLandValuePerSqm');
  const inputYear = numberValue('currentBrwYear') || getValuationYear();
  const valuationDate = getValuationDate();
  const valuationYear = valuationDate.getFullYear();
  const rows = historyRows().filter((point) => point.year !== inputYear);

  if (!inputBrw || !inputYear) {
    return {
      inputBrw,
      inputYear,
      automaticBrw: 0,
      factor: 1,
      info: 'BRW: Es wird mindestens eine vollständige BRW-Zeile benötigt: Jahr + BRW.',
    };
  }

  if (rows.length < 1) {
    return {
      inputBrw,
      inputYear,
      automaticBrw: inputBrw,
      factor: 1,
      info: `BRW: ${inputYear} = ${money(inputBrw)}/m². Kein zweiter BRW vorhanden; automatischer BRW = Eingabe, Zeitfaktor 1,000.`,
    };
  }

  const priorRows = rows.filter((point) => point.year < inputYear);
  const reference = priorRows.length ? priorRows[priorRows.length - 1] : rows[0];
  const yearSpan = inputYear - reference.year;

  if (yearSpan <= 0) {
    return {
      inputBrw,
      inputYear,
      automaticBrw: inputBrw,
      factor: 1,
      info: `BRW: zweiter BRW liegt nicht vor dem Eingabejahr ${inputYear}. Keine lineare Korrektur; Zeitfaktor 1,000.`,
    };
  }

  const annualDelta = (inputBrw - reference.value) / yearSpan;
  const dayFraction = daysFromCurrentYearStart(inputYear, valuationDate) / 365;
  const automaticBrw = inputBrw + annualDelta * dayFraction;
  const factor = automaticBrw > 0 ? automaticBrw / inputBrw : 1;

  return {
    inputBrw,
    inputYear,
    automaticBrw,
    factor,
    info: `BRW: Eingabe ${inputYear} = ${money(inputBrw)}/m²; historisch ${reference.year} = ${money(reference.value)}/m². Linearer Trend ${(annualDelta).toLocaleString('de-DE', { maximumFractionDigits: 2 })} €/m²·a. Stichtag ${valuationDate.toLocaleDateString('de-DE')} (${numberText(dayFraction, 3)} a ab Jahresbeginn ${inputYear}) → automatischer BRW ${money(automaticBrw)}/m²; Zeitfaktor ${numberText(factor, 3)}.`,
  };
}

function applyBrwModel() {
  ensureStyle();
  ensureAutomaticBrwField();
  normalizePrimaryLabels();
  setVersionLabel();

  const brw = $('baseLandValuePerSqm');
  if (brw) brw.readOnly = false;

  $('brwDerivedHint')?.remove();

  const year = $('currentBrwYear');
  if (year && !year.value) year.value = getValuationYear();

  const result = calculateAutomaticBrw();

  setValue('automaticBrwPerSqm', result.automaticBrw ? Math.round(result.automaticBrw) : '');
  setValue('timeAdjustmentFactor', numberText(result.factor, 3).replace(',', '.'));

  const trendInfo = $('brwTrendInfo');
  if (trendInfo) trendInfo.textContent = result.info;

  const brwSummary = $('workflowBrwSection')?.querySelector('[data-workflow-summary]');
  if (brwSummary) {
    const wgfz = numberValue('wgfzSoll');
    const reference = numberValue('referencePlotSize');
    brwSummary.textContent = `BRW ${result.automaticBrw ? `${money(result.automaticBrw)}/m²` : 'offen'} · Eingabe ${result.inputYear || '–'} / ${result.inputBrw ? money(result.inputBrw) : '–'} · WGFZ ${wgfz ? numberText(wgfz, 2) : '–'} · Ref. ${reference ? `${numberText(reference, 0)} m²` : '–'}`;
  }

  const landSummary = $('landSummary');
  if (landSummary) {
    const wgfzFactor = numberValue('wgfzCorrectionFactor') || 1;
    const manual = numberValue('manualLocationFactor') || 1;
    const referenceFactor = numberValue('referenceAreaFactor') || 1;
    const correctionFactor = wgfzFactor * manual * referenceFactor;
    const weightedArea = numberValue('buildingLandArea') + numberValue('gardenArea') * numberValue('gardenFactor');
    const beitragsfrei = result.automaticBrw * correctionFactor;
    const landValue = beitragsfrei * weightedArea;
    landSummary.textContent = `BRW ${result.automaticBrw ? `${money(result.automaticBrw)}/m²` : 'offen'} · Faktor ${numberText(correctionFactor, 3)} · beitragsfrei ${money(beitragsfrei)}/m² · Fläche ${numberText(weightedArea, 0)} m² · Bodenwert ${money(landValue)}`;
  }

  return result;
}

function installBrwModel() {
  if (window.__brwRowModelInstalled) return;
  window.__brwRowModelInstalled = true;

  window.calculateBrwTimeFactor = (currentBrw) => {
    const result = calculateAutomaticBrw();
    return { factor: result.factor, info: result.info };
  };
  window.deriveBrwFromHistory = applyBrwModel;

  document.addEventListener('input', (event) => {
    if (
      event.target?.id === 'baseLandValuePerSqm' ||
      event.target?.id === 'currentBrwYear' ||
      event.target?.id === 'valuationDate' ||
      event.target?.dataset?.historyField !== undefined
    ) {
      window.setTimeout(applyBrwModel, 0);
    }
  });

  document.addEventListener('change', (event) => {
    if (
      event.target?.id === 'baseLandValuePerSqm' ||
      event.target?.id === 'currentBrwYear' ||
      event.target?.id === 'valuationDate' ||
      event.target?.dataset?.historyField !== undefined
    ) {
      window.setTimeout(applyBrwModel, 0);
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target?.id === 'addBrwHistory' || event.target?.dataset?.removeHistory !== undefined) {
      window.setTimeout(applyBrwModel, 0);
    }
  });

  [0, 100, 300, 800, 1500, 3000, 5000].forEach((delay) => {
    window.setTimeout(applyBrwModel, delay);
  });
}

installBrwModel();
