const VERSION = 'V0.2.8';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

function $(id) {
  return document.getElementById(id);
}

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function labelFor(id) {
  return $(id)?.closest('label') || null;
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function normalizeFieldTitle(label, text) {
  if (!label) return;

  const title = label.querySelector('.field-title');
  if (title) {
    const tooltip = title.querySelector('.info-tooltip');
    title.textContent = `${text} `;
    if (tooltip) title.appendChild(tooltip);
    return;
  }

  const control = Array.from(label.children).find((child) =>
    child.matches?.('input, select, textarea'),
  );
  if (!control) return;

  Array.from(label.childNodes).forEach((node) => {
    if (node !== control && node.nodeType === Node.TEXT_NODE) node.remove();
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'field-title';
  wrapper.textContent = text;
  label.insertBefore(wrapper, control);
}

function ensureCaptureDateField() {
  if ($('captureDate')) return;

  const objectBody = $('objectName')?.closest('details.section')?.querySelector(':scope > .section-body');
  const valuationLabel = labelFor('valuationDate');
  const addressLabel = labelFor('borisAddress');
  const target = objectBody || valuationLabel?.parentNode;
  if (!target) return;

  const label = document.createElement('label');
  label.innerHTML = `Erfassungsdatum
    <input type="date" id="captureDate" value="${todayIsoDate()}">
    <small>Datum der Datenerfassung, Besichtigung oder Bearbeitung</small>`;

  if (valuationLabel && valuationLabel.parentNode === target) {
    target.insertBefore(label, valuationLabel);
  } else if (addressLabel?.nextSibling) {
    target.insertBefore(label, addressLabel.nextSibling);
  } else {
    target.appendChild(label);
  }
}

function moveValuationDateToStichtag() {
  const valuationLabel = labelFor('valuationDate');
  const stichtagBody = $('workflowStichtagSubsection')?.querySelector(':scope > .section-body');
  if (!valuationLabel || !stichtagBody) return;

  normalizeFieldTitle(valuationLabel, 'Rechenrelevanter Stichtag');
  const small = valuationLabel.querySelector('small');
  if (small) small.textContent = 'Bewertungs-/Berechnungsstichtag für BRW-Fortschreibung';
  else valuationLabel.appendChild(Object.assign(document.createElement('small'), {
    textContent: 'Bewertungs-/Berechnungsstichtag für BRW-Fortschreibung',
  }));

  const firstChild = stichtagBody.firstElementChild;
  if (valuationLabel.parentNode !== stichtagBody) {
    stichtagBody.insertBefore(valuationLabel, firstChild || null);
  } else if (firstChild && firstChild !== valuationLabel) {
    stichtagBody.insertBefore(valuationLabel, firstChild);
  }

  const summaryTitle = $('workflowStichtagSubsection')?.querySelector('summary span');
  if (summaryTitle) summaryTitle.textContent = 'Option Stichtag / Historie';
}

function updateObjectSummary() {
  const objectSection = $('objectName')?.closest('details.section');
  const summary = objectSection?.querySelector('summary strong');
  if (!summary) return;

  const name = $('objectName')?.value || 'Name offen';
  const address = $('borisAddress')?.value || 'Adresse offen';
  const captureDate = $('captureDate')?.value || 'Erfassung offen';
  const plot = parseFloat($('plotArea')?.value || '0') || 0;
  const area = parseFloat($('totalArea')?.value || '0') || 0;
  const plotText = plot ? `${plot.toLocaleString('de-DE', { maximumFractionDigits: 0 })} m² Grund` : 'Grund offen';
  const areaText = area ? `${area.toLocaleString('de-DE', { maximumFractionDigits: 0 })} m² Wfl.` : 'Wfl. offen';

  summary.textContent = `${name} · ${address} · Erfassung ${captureDate} · ${plotText} · ${areaText}`;
}

function applyDateModel() {
  ensureCaptureDateField();
  moveValuationDateToStichtag();
  setVersionLabel();
  updateObjectSummary();
}

function installDateModel() {
  if (window.__dateModelInstalled) return;
  window.__dateModelInstalled = true;

  document.addEventListener('input', (event) => {
    if (
      event.target?.id === 'captureDate' ||
      event.target?.id === 'objectName' ||
      event.target?.id === 'borisAddress' ||
      event.target?.id === 'plotArea' ||
      event.target?.id === 'totalArea'
    ) {
      window.setTimeout(updateObjectSummary, 0);
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target?.id === 'captureDate') window.setTimeout(updateObjectSummary, 0);
    if (event.target?.id === 'valuationDate') window.setTimeout(applyDateModel, 0);
  });

  [0, 100, 300, 800, 1500, 3000, 5000].forEach((delay) => {
    window.setTimeout(applyDateModel, delay);
  });
}

installDateModel();
