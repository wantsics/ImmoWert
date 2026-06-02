const VERSION = 'V0.2.11';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

let installed = false;

function $(id) {
  return document.getElementById(id);
}

function labelFor(id) {
  return $(id)?.closest('label') || null;
}

function numberValue(id) {
  return parseFloat(String($(id)?.value || '').replace(',', '.')) || 0;
}

function numberText(value, digits = 0) {
  return (Number(value) || 0).toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function sectionBody(section) {
  return section?.querySelector(':scope > .section-body') || null;
}

function moveElement(element, target) {
  if (element && target && element.parentNode !== target) target.appendChild(element);
}

function moveLabel(id, target) {
  moveElement(labelFor(id), target);
}

function createSubsection(id, title, summaryText = '–') {
  const details = document.createElement('details');
  details.id = id;
  details.className = 'source-subsection';
  details.open = true;
  details.innerHTML = `<summary><span>${title}</span><strong data-workflow-summary>${summaryText}</strong></summary><div class="section-body grid three"></div>`;
  return details;
}

function ensureStyle() {
  if ($('objectAreaModelCss')) return;

  const style = document.createElement('style');
  style.id = 'objectAreaModelCss';
  style.textContent = `
    .workflow-ui #workflowObjectAreasSubsection {
      grid-column: 1 / -1;
    }
    .workflow-ui #workflowObjectAreasSubsection .section-body {
      padding-bottom: 0;
    }
    .workflow-ui .land-value-result-block {
      grid-column: 1 / -1;
      background: #f8fafc;
      border: 1px solid #dbeafe;
      border-radius: 14px;
      padding: 14px;
    }
  `;
  document.head.appendChild(style);
}

function placeObjectAreas() {
  const objectSection = $('objectName')?.closest('details.section');
  const objectBody = sectionBody(objectSection);
  if (!objectBody) return;

  let areaSection = $('workflowObjectAreasSubsection');
  if (!areaSection) {
    areaSection = createSubsection('workflowObjectAreasSubsection', 'Grundstück / Flächen', '–');
    const units = $('workflowUnitsSubsection');
    if (units?.parentNode === objectBody) objectBody.insertBefore(areaSection, units);
    else objectBody.appendChild(areaSection);
  }

  const areaBody = sectionBody(areaSection);
  if (!areaBody) return;
  areaBody.className = 'section-body grid three';

  moveLabel('plotArea', areaBody);
  moveLabel('relevantFloorArea', areaBody);
  moveLabel('actualWgfz', areaBody);
  moveLabel('buildingLandArea', areaBody);
  moveLabel('gardenArea', areaBody);
  moveLabel('gardenFactor', areaBody);
}

function cleanLandValueSection() {
  const landSection = $('landSummary')?.closest('details.section');
  const landBody = sectionBody(landSection);
  if (!landBody) return;

  landBody.className = 'section-body grid two';

  const factors = $('workflowFactorsSubsection');
  if (factors) moveElement(factors, landBody);

  const trend = $('brwTrendInfo');
  const brwSection = $('workflowStichtagSubsection');
  const stichtagBody = sectionBody(brwSection);
  if (trend && stichtagBody && trend.parentNode !== stichtagBody) {
    moveElement(trend, stichtagBody);
  }

  const chain = $('landValueChain');
  if (chain) {
    chain.classList.add('land-value-result-block');
    moveElement(chain, landBody);
  }
}

function updateSummaries() {
  const areaSection = $('workflowObjectAreasSubsection');
  const plot = numberValue('plotArea');
  const relevant = numberValue('relevantFloorArea');
  const building = numberValue('buildingLandArea');
  const garden = numberValue('gardenArea');
  const gardenFactor = numberValue('gardenFactor');
  const weighted = building + garden * gardenFactor;

  const summary = areaSection?.querySelector('[data-workflow-summary]');
  if (summary) {
    summary.textContent = `${plot ? `${numberText(plot)} m² Grundstück` : 'Grundstück offen'} · ${relevant ? `${numberText(relevant)} m² WGF` : 'WGF offen'} · ${weighted ? `${numberText(weighted)} m² gewichtet` : 'Fläche offen'}`;
  }

  const objectSection = $('objectName')?.closest('details.section');
  const objectSummary = objectSection?.querySelector('summary strong');
  if (objectSummary) {
    const name = $('objectName')?.value || 'Name offen';
    const address = $('borisAddress')?.value || 'Adresse offen';
    const area = numberValue('totalArea');
    objectSummary.textContent = `${name} · ${address} · ${plot ? `${numberText(plot)} m² Grund` : 'Grund offen'} · ${area ? `${numberText(area)} m² Wfl.` : 'Wfl. offen'}`;
  }
}

function applyObjectAreaLayout() {
  setVersionLabel();
  ensureStyle();
  placeObjectAreas();
  cleanLandValueSection();
  updateSummaries();
}

function installObjectAreaModel() {
  if (installed) return;
  installed = true;

  document.addEventListener('input', () => window.setTimeout(applyObjectAreaLayout, 0));
  document.addEventListener('change', () => window.setTimeout(applyObjectAreaLayout, 0));

  [0, 100, 300, 800, 1500, 3000, 5000].forEach((delay) => {
    window.setTimeout(applyObjectAreaLayout, delay);
  });
}

installObjectAreaModel();
