const VERSION = 'V0.2.4';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

function $(id) {
  return document.getElementById(id);
}

function labelFor(id) {
  return $(id)?.closest('label') || null;
}

function money(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function numberValue(id) {
  return parseFloat(String($(id)?.value || '').replace(',', '.')) || 0;
}

function numberText(value, digits = 3) {
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

function ensureStyles() {
  if ($('sourceWorkflowCss')) return;

  const style = document.createElement('style');
  style.id = 'sourceWorkflowCss';
  style.textContent = `
    .workflow-ui {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .workflow-ui .section {
      margin-bottom: 0;
      border: 1px solid #bae6fd;
      border-radius: 18px;
      background: rgba(255,255,255,0.78);
      padding: 0 16px 16px;
    }
    .workflow-ui .source-section > summary,
    .workflow-ui .source-subsection > summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 0;
      border-bottom: 1px solid #bae6fd;
      margin: 0 0 14px;
    }
    .workflow-ui .source-section > summary span,
    .workflow-ui .source-subsection > summary span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-weight: 800;
      line-height: 1.25;
      white-space: nowrap;
    }
    .workflow-ui .source-section > summary strong,
    .workflow-ui .source-subsection > summary strong {
      color: #0369a1;
      text-align: right;
      overflow-wrap: anywhere;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 700;
    }
    .workflow-ui .section-body {
      padding-bottom: 0;
    }
    .workflow-ui .grid {
      gap: 14px;
    }
    .workflow-ui label {
      min-width: 0;
      gap: 6px;
      font-weight: 600;
      line-height: 1.25;
    }
    .workflow-ui .field-title {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 22px;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .workflow-ui .field-title .info-tooltip,
    .workflow-ui summary .info-tooltip,
    .workflow-ui .section-title-inline .info-tooltip {
      flex: 0 0 auto;
      margin-left: 0;
    }
    .workflow-ui input,
    .workflow-ui select {
      min-height: 44px;
      padding: 10px 12px;
      font-size: 15px;
    }
    .workflow-ui input[type='checkbox'] {
      width: 18px;
      min-width: 18px;
      height: 18px;
      min-height: 18px;
      padding: 0;
      margin: 0;
      accent-color: #0ea5e9;
    }
    .workflow-ui small {
      line-height: 1.3;
      color: #64748b;
    }
    .workflow-ui .section-title-inline {
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .workflow-ui .section-title-inline strong {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      line-height: 1.25;
    }
    .workflow-ui .history-block,
    .workflow-ui .unit-card,
    .workflow-ui .market-profile-block,
    .workflow-ui .bog-list-block,
    .workflow-ui .rnd-method-selector {
      background: #f8fafc;
      border: 1px solid #dbeafe;
      border-radius: 14px;
      padding: 14px;
    }
    .workflow-ui .source-subsection {
      grid-column: 1 / -1;
      margin: 0;
      padding: 0 14px 14px;
      border: 1px solid #dbeafe;
      border-radius: 14px;
      background: #f8fafc;
    }
    .workflow-ui .source-subsection > summary {
      cursor: pointer;
    }
    .workflow-ui .source-hint {
      grid-column: 1 / -1;
      margin: 8px 0 0;
      padding: 12px;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      background: #f0f9ff;
      color: #0f172a;
      font-size: 13px;
      line-height: 1.45;
    }
    .workflow-ui #marketProfileBlock {
      margin-top: 0;
    }
    .workflow-ui #wgfzBlock {
      margin-top: 0;
    }
    .workflow-ui #wgfzBlock .grid.three,
    .workflow-ui .unit-card .grid.three {
      gap: 12px;
    }
    .workflow-ui .hint {
      margin-top: 10px;
      padding: 14px;
      font-size: 13px;
      line-height: 1.45;
    }
    .info-tooltip {
      width: 17px;
      height: 17px;
      min-width: 17px;
      min-height: 17px;
      font-size: 11px;
      line-height: 17px;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);
}

function normalizeTextNode(node) {
  const text = node.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return document.createTextNode(`${text} `);
}

function normalizeLabelTitles(root = document) {
  root.querySelectorAll('label').forEach((label) => {
    if (label.dataset.titleNormalized === '1') return;

    const control = Array.from(label.children).find((child) =>
      child.matches?.('input, select, textarea'),
    );
    if (!control) return;

    const titleNodes = [];
    Array.from(label.childNodes).some((node) => {
      if (node === control) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = normalizeTextNode(node);
        if (textNode) titleNodes.push(textNode);
        node.remove();
        return false;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('info-tooltip')) {
        titleNodes.push(node);
        return false;
      }
      return false;
    });

    if (!titleNodes.length) {
      label.dataset.titleNormalized = '1';
      return;
    }

    const title = document.createElement('div');
    title.className = 'field-title';
    titleNodes.forEach((node) => title.appendChild(node));
    label.insertBefore(title, control);
    label.dataset.titleNormalized = '1';
  });
}

function installLabelNormalizer() {
  if (window.__workflowLabelNormalizerInstalled) return;
  window.__workflowLabelNormalizerInstalled = true;

  const observer = new MutationObserver(() => normalizeLabelTitles(document));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  normalizeLabelTitles(document);
}

function createSection(id, title, summaryText = '–') {
  const details = document.createElement('details');
  details.id = id;
  details.className = 'section source-section';
  details.open = true;
  details.innerHTML = `<summary><span>${title}</span><strong data-workflow-summary>${summaryText}</strong></summary><div class="section-body grid two"></div>`;
  return details;
}

function createSubsection(id, title, summaryText = '–') {
  const details = document.createElement('details');
  details.id = id;
  details.className = 'source-subsection';
  details.open = true;
  details.innerHTML = `<summary><span>${title}</span><strong data-workflow-summary>${summaryText}</strong></summary><div class="section-body grid two"></div>`;
  return details;
}

function sectionBody(section) {
  return section?.querySelector(':scope > .section-body') || null;
}

function setSectionSummary(section, value) {
  const summary = section?.querySelector('[data-workflow-summary]') || section?.querySelector('summary strong');
  if (summary) summary.textContent = value || '–';
}

function moveElement(element, target) {
  if (element && target && element.parentNode !== target) target.appendChild(element);
}

function moveLabel(inputId, target) {
  moveElement(labelFor(inputId), target);
}

function insertBeforeFormSection(form, section, beforeSection) {
  if (!form || !section) return;
  if (beforeSection && section.parentNode !== form) form.insertBefore(section, beforeSection);
  else if (section.parentNode !== form) form.appendChild(section);
}

function ensureReferenceFields(target) {
  if (!target || $('referencePlotSize')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'full-width grid three';
  wrapper.innerHTML = `
    <label>Referenzgröße
      <input type="number" id="referencePlotSize" min="0" step="1" disabled>
      <small>aktiv, wenn Marktprofil Referenzgrößenkorrektur nutzt</small>
    </label>
    <label>Flur optional
      <input id="parcelNumber" placeholder="z. B. 2372/7">
    </label>
    <label>Gemarkung optional
      <input id="districtName" placeholder="z. B. Stuttgart-Heumaden">
    </label>`;
  target.appendChild(wrapper);
}

function ensureReferenceFactorBlock(target) {
  if (!target || $('referenceFactorBlock')) return;

  const block = document.createElement('div');
  block.id = 'referenceFactorBlock';
  block.className = 'history-block full-width';
  block.innerHTML = `
    <div class="section-title-inline">
      <strong>Ref-Flächen-Faktor</strong><small>abhängig vom Marktprofil</small>
    </div>
    <div class="grid two compact-grid">
      <label>Ref-Flächen-Faktor<input type="number" id="referenceAreaFactor" value="1.000" readonly><small>neutral, solange keine Referenzgrößenlogik aktiv ist</small></label>
      <label>Herleitung<input value="Im aktiven Marktprofil aktuell nicht berechnet" readonly><small>Tabellenwert/Formel wird später hier angezeigt</small></label>
    </div>`;
  target.appendChild(block);
}

function placeMarketProfile(form, objectSection) {
  const marketBlock = $('marketProfileBlock');
  if (!marketBlock || $('workflowMarketSection')) return false;

  const section = createSection('workflowMarketSection', 'Marktprofil', '–');
  const body = sectionBody(section);
  moveElement(marketBlock, body);
  insertBeforeFormSection(form, section, objectSection);
  return true;
}

function placeObjectAndUnits(objectSection, incomeSection) {
  if (!objectSection) return;

  objectSection.classList.add('source-section');
  const summaryTitle = objectSection.querySelector('summary span');
  if (summaryTitle) summaryTitle.textContent = 'Objekt';

  const body = sectionBody(objectSection);
  if (!body || $('workflowUnitsSubsection')) return;

  const unitsSubsection = createSubsection('workflowUnitsSubsection', 'Einheiten', '–');
  const unitsBody = sectionBody(unitsSubsection);
  unitsBody.className = 'section-body';
  moveElement($('unitsContainer'), unitsBody);

  const addUnitButton = $('addUnit');
  const addUnitRow = addUnitButton?.closest('.button-row') || addUnitButton;
  moveElement(addUnitRow, unitsBody);

  body.appendChild(unitsSubsection);

  if (incomeSection) {
    const title = incomeSection.querySelector('summary span');
    if (title) title.textContent = 'Ertrag / Bewirtschaftung';
  }
}

function placeBrwSection(form, landSection) {
  if (!landSection) return null;

  let section = $('workflowBrwSection');
  if (!section) {
    section = createSection('workflowBrwSection', 'Bodenrichtwert', '–');
    insertBeforeFormSection(form, section, landSection);
  }

  const body = sectionBody(section);
  body.className = 'section-body grid two';

  moveLabel('baseLandValuePerSqm', body);
  moveLabel('wgfzSoll', body);
  ensureReferenceFields(body);

  const stichtag = $('workflowStichtagSubsection') || createSubsection('workflowStichtagSubsection', 'Option Stichtag / Historie', '–');
  const stichtagBody = sectionBody(stichtag);
  stichtagBody.className = 'section-body grid two';
  moveLabel('timeAdjustmentFactor', stichtagBody);
  moveElement($('brwHistoryContainer')?.closest('.history-block'), stichtagBody);
  moveElement(stichtag, body);

  return section;
}

function placeLandValueSection(landSection) {
  if (!landSection) return;

  landSection.classList.add('source-section');
  const title = landSection.querySelector('summary span');
  if (title) title.textContent = 'Bodenwert';

  const body = sectionBody(landSection);
  if (!body) return;
  body.className = 'section-body grid three';

  const factors = $('workflowFactorsSubsection') || createSubsection('workflowFactorsSubsection', 'Korrekturfaktoren', '–');
  const factorsBody = sectionBody(factors);
  factorsBody.className = 'section-body grid two';

  moveLabel('landFeatureFactor', factorsBody);
  moveLabel('manualLocationFactor', factorsBody);
  moveElement($('wgfzBlock'), factorsBody);
  ensureReferenceFactorBlock(factorsBody);
  moveElement(factors, body);

  moveLabel('plotArea', body);
  moveLabel('relevantFloorArea', body);
  moveLabel('actualWgfz', body);
  moveLabel('buildingLandArea', body);
  moveLabel('gardenArea', body);
  moveLabel('gardenFactor', body);
  moveElement($('brwTrendInfo'), body);
  moveElement($('landValueChain'), body);
}

function weightedArea() {
  return numberValue('buildingLandArea') + numberValue('gardenArea') * numberValue('gardenFactor');
}

function updateWorkflowSummaries() {
  const profile = $('marketProfileSelect')?.selectedOptions?.[0]?.textContent || '–';
  const yieldSource = $('yieldSourceSelect')?.selectedOptions?.[0]?.textContent || '–';
  setSectionSummary($('workflowMarketSection'), `${profile} · ${yieldSource}`);

  const name = $('objectName')?.value || 'Name offen';
  const address = $('borisAddress')?.value || 'Adresse offen';
  const plot = numberValue('plotArea');
  const area = numberValue('totalArea');
  setSectionSummary(
    $('objectName')?.closest('details.section'),
    `${name} · ${address} · ${plot ? `${numberText(plot, 0)} m² Grund` : 'Grund offen'} · ${area ? `${numberText(area, 0)} m² Wfl.` : 'Wfl. offen'}`,
  );

  const units = Number($('unitCountDisplay')?.value || 0);
  setSectionSummary($('workflowUnitsSubsection'), `${units || 0} Einheiten · ${area ? `${numberText(area, 0)} m² Wfl.` : 'Wfl. offen'}`);

  const brw = numberValue('baseLandValuePerSqm');
  const wgfzSoll = numberValue('wgfzSoll');
  const reference = numberValue('referencePlotSize');
  setSectionSummary(
    $('workflowBrwSection'),
    `BRW ${brw ? `${money(brw)}/m²` : 'offen'} · WGFZ ${wgfzSoll ? numberText(wgfzSoll, 2) : '–'} · Ref. ${reference ? `${numberText(reference, 0)} m²` : '–'}`,
  );

  const timeFactor = numberValue('timeAdjustmentFactor') || 1;
  setSectionSummary($('workflowStichtagSubsection'), `Zeitfaktor ${numberText(timeFactor, 3)}`);

  const wgfzFactor = numberValue('wgfzCorrectionFactor') || 1;
  const manual = numberValue('manualLocationFactor') || 1;
  const referenceFactor = numberValue('referenceAreaFactor') || 1;
  const totalFactor = timeFactor * wgfzFactor * manual * referenceFactor;
  setSectionSummary($('workflowFactorsSubsection'), `Gesamtfaktor ${numberText(totalFactor, 3)}`);

  const landSummary = $('landSummary');
  const beitragsfrei = brw * totalFactor;
  const areaWeighted = weightedArea();
  const landValue = beitragsfrei * areaWeighted;
  const text = `BRW ${brw ? `${money(brw)}/m²` : 'offen'} · Gesamtfaktor ${numberText(totalFactor, 3)} · beitragsfrei ${money(beitragsfrei)}/m² · Fläche ${numberText(areaWeighted, 0)} m² · Bodenwert ${money(landValue)}`;
  if (landSummary) landSummary.textContent = text;
}

function installWorkflowEvents() {
  if (window.__workflowUiEventsInstalled) return;
  window.__workflowUiEventsInstalled = true;

  document.addEventListener('input', updateWorkflowSummaries);
  document.addEventListener('change', updateWorkflowSummaries);
}

function buildWorkflow() {
  const form = $('valuationForm');
  if (!form) return false;

  form.classList.add('workflow-ui');
  ensureStyles();
  setVersionLabel();
  normalizeLabelTitles(form);

  const objectSection = $('objectName')?.closest('details.section');
  const landSection = $('baseLandValuePerSqm')?.closest('details.section') || $('plotArea')?.closest('details.section');
  const incomeSection = $('unitsContainer')?.closest('details.section');

  placeMarketProfile(form, objectSection);
  placeObjectAndUnits(objectSection, incomeSection);
  placeBrwSection(form, landSection);
  placeLandValueSection(landSection);
  installLabelNormalizer();
  installWorkflowEvents();
  updateWorkflowSummaries();

  return true;
}

function scheduleWorkflowBuild() {
  [0, 100, 300, 700, 1500, 2500, 5000].forEach((delay) => {
    window.setTimeout(buildWorkflow, delay);
  });

  document.addEventListener('DOMContentLoaded', () => {
    [0, 100, 300, 700, 1500, 2500, 5000].forEach((delay) => {
      window.setTimeout(buildWorkflow, delay);
    });
  });
}

scheduleWorkflowBuild();
