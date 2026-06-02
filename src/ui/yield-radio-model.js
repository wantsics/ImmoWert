const VERSION = 'V0.2.16';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

let installed = false;

function $(id) {
  return document.getElementById(id);
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function escapeText(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

function parseYieldOption(option) {
  const text = option.textContent || '';
  const parts = text.split('·').map((part) => part.trim());
  const label = parts[0] || option.value;
  const rateMatch = text.match(/([0-9]+(?:[,.][0-9]+)?)\s*%/);
  const rate = rateMatch ? `${rateMatch[1].replace('.', ',')} %` : 'manuell';
  return { id: option.value, label, rate };
}

function ensureStyle() {
  if ($('yieldRadioModelCss')) return;

  const style = document.createElement('style');
  style.id = 'yieldRadioModelCss';
  style.textContent = `
    .workflow-ui .yield-box {
      display: none !important;
    }
    .workflow-ui .yield-radio-block {
      grid-column: 1 / -1;
      border: 1px solid #dbeafe;
      border-radius: 14px;
      background: #f8fafc;
      padding: 12px;
    }
    .workflow-ui .yield-radio-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font-weight: 800;
      color: #0f172a;
    }
    .workflow-ui .yield-radio-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .workflow-ui .yield-radio-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 12px;
      min-height: 34px;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-weight: 650;
      line-height: 1.2;
    }
    .workflow-ui .yield-radio-row:hover {
      border-color: #7dd3fc;
      background: #f0f9ff;
    }
    .workflow-ui .yield-radio-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .workflow-ui .yield-radio-rate {
      color: #0369a1;
      font-weight: 850;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .workflow-ui .yield-radio-row input[type='radio'] {
      width: 16px;
      min-width: 16px;
      height: 16px;
      min-height: 16px;
      padding: 0;
      margin: 0;
      accent-color: #0ea5e9;
    }
    .workflow-ui .yield-radio-row:has(input[type='radio']:checked) {
      border-color: #0ea5e9;
      background: #eff6ff;
    }
    .workflow-ui #yieldSourceSelect {
      display: none;
    }
    .workflow-ui #yieldSourceSelectLabel {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

function ensureYieldRadioBlock() {
  const select = $('yieldSourceSelect');
  const propertyYield = $('propertyYield');
  if (!select || !propertyYield) return null;

  const selectLabel = select.closest('label');
  if (selectLabel) selectLabel.id = 'yieldSourceSelectLabel';

  const propertyYieldLabel = propertyYield.closest('label');
  const modelBody = propertyYield.closest('.section-body') || propertyYieldLabel?.parentNode;
  if (!modelBody) return null;

  let block = $('yieldRadioBlock');
  if (!block) {
    block = document.createElement('div');
    block.id = 'yieldRadioBlock';
    block.className = 'yield-radio-block';
    block.innerHTML = `
      <div class="yield-radio-title">
        <span>Liegenschaftszinssatz aus Marktprofil</span>
        <small>eine Zeile pro Modellansatz</small>
      </div>
      <div id="yieldRadioList" class="yield-radio-list"></div>`;
  }

  const insertAfter = propertyYieldLabel?.nextSibling || modelBody.firstChild;
  if (block.parentNode !== modelBody) {
    modelBody.insertBefore(block, insertAfter);
  } else if (propertyYieldLabel && block.previousElementSibling !== propertyYieldLabel) {
    modelBody.insertBefore(block, propertyYieldLabel.nextSibling);
  }

  return block;
}

function renderYieldRadios() {
  setVersionLabel();
  ensureStyle();

  const select = $('yieldSourceSelect');
  const block = ensureYieldRadioBlock();
  const list = $('yieldRadioList');
  if (!select || !block || !list) return;

  const options = Array.from(select.options).map(parseYieldOption);
  const signature = options.map((option) => `${option.id}:${option.label}:${option.rate}`).join('|');
  const selected = select.value;

  if (list.dataset.signature !== signature) {
    list.innerHTML = options
      .map(
        (option) => `
          <label class="yield-radio-row" title="${escapeText(option.label)}">
            <span class="yield-radio-label">${escapeText(option.label)}</span>
            <span class="yield-radio-rate">${escapeText(option.rate)}</span>
            <input type="radio" name="yieldSourceRadio" value="${escapeText(option.id)}">
          </label>`,
      )
      .join('');
    list.dataset.signature = signature;
  }

  list.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.checked = radio.value === selected;
  });
}

function syncRadioToSelect(radio) {
  const select = $('yieldSourceSelect');
  if (!select || !radio?.value) return;

  if (select.value !== radio.value) {
    select.value = radio.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  renderYieldRadios();
}

function installYieldRadioModel() {
  if (installed) return;
  installed = true;

  document.addEventListener('change', (event) => {
    if (event.target?.name === 'yieldSourceRadio') syncRadioToSelect(event.target);
    if (event.target?.id === 'yieldSourceSelect' || event.target?.id === 'marketProfileSelect') {
      window.setTimeout(renderYieldRadios, 0);
      window.setTimeout(renderYieldRadios, 100);
    }
  });

  [0, 100, 300, 700, 1200, 2000, 4000].forEach((delay) => {
    window.setTimeout(renderYieldRadios, delay);
  });
}

installYieldRadioModel();
