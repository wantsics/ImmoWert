import '../ui/workflow.js';
import '../ui/brw-model.js';
import '../ui/date-model.js';
import '../ui/generic-land-model.js';
import '../ui/object-area-model.js';
import '../ui/yield-radio-model.js';
import '../ui/app-version.js';

export const WGFZ_MODELS = Object.freeze({
  LOWRISE: 'lowrise',
  MULTI: 'multi',
});

export const WGFZ_TABLES = Object.freeze({
  lowrise: Object.freeze([
    [0.3, 0.69],
    [0.4, 0.75],
    [0.5, 0.8],
    [0.6, 0.84],
    [0.7, 0.88],
    [0.8, 0.92],
    [0.9, 0.96],
    [1.0, 1.0],
    [1.1, 1.05],
  ]),
  multi: Object.freeze([
    [0.8, 0.94],
    [0.9, 0.97],
    [1.0, 1.0],
    [1.1, 1.03],
    [1.2, 1.07],
    [1.3, 1.1],
    [1.4, 1.14],
    [1.5, 1.18],
    [1.6, 1.22],
    [1.7, 1.27],
    [1.8, 1.31],
    [1.9, 1.36],
    [2.0, 1.41],
    [2.1, 1.46],
    [2.2, 1.51],
    [2.3, 1.56],
    [2.4, 1.61],
  ]),
});

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function assertPositive(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
}

function setVisibleAppVersion() {
  if (typeof document === 'undefined') return;

  const label = 'LAB7784 Immowert V0.2.11';
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = label;
  });
  document.title = `${label} – Analyse & Datenerhebung`;
}

function showFixedAppVersionBadge() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('fixedAppVersionBadge')) return;

  const badge = document.createElement('div');
  badge.id = 'fixedAppVersionBadge';
  badge.textContent = 'LAB7784 Immowert V0.2.11';
  badge.setAttribute('aria-label', 'App-Version LAB7784 Immowert V0.2.11');
  badge.style.cssText = [
    'position:fixed',
    'right:14px',
    'bottom:10px',
    'z-index:999999',
    'padding:6px 10px',
    'border-radius:999px',
    'background:rgba(15,23,42,0.92)',
    'color:#e0f2fe',
    'font-size:12px',
    'font-weight:800',
    'letter-spacing:0.03em',
    'box-shadow:0 8px 24px rgba(15,23,42,0.25)',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(badge);
}

function installVisibleAppVersion() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  setVisibleAppVersion();
  showFixedAppVersionBadge();

  document.addEventListener('DOMContentLoaded', () => {
    setVisibleAppVersion();
    showFixedAppVersionBadge();
  });

  [0, 100, 500, 1500].forEach((delay) => {
    window.setTimeout(() => {
      setVisibleAppVersion();
      showFixedAppVersionBadge();
    }, delay);
  });
}

function syncWgfzControlsEnabledState() {
  if (typeof document === 'undefined') return;

  const activeInput = document.getElementById('wgfzActive');
  if (!activeInput) return;

  const active = activeInput.checked;
  const inactiveControlIds = [
    'wgfzModel',
    'wgfzSoll',
    'wgfzIst',
    'wgfzReferenceCoeff',
    'wgfzTargetCoeff',
    'wgfzCorrectionFactor',
    'wgfzExtrapolate',
  ];

  inactiveControlIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.disabled = !active;
  });
}

function installWgfzControlsObserver() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

  document.addEventListener('change', (event) => {
    if (event.target?.id === 'wgfzActive') syncWgfzControlsEnabledState();
  });

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'wgfzActive') syncWgfzControlsEnabledState();
  });

  const observer = new MutationObserver(() => syncWgfzControlsEnabledState());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(syncWgfzControlsEnabledState, 0);
}

installVisibleAppVersion();
installWgfzControlsObserver();

export function getWgfzTable(model) {
  const table = WGFZ_TABLES[model];
  if (!table) {
    throw new Error(`Unknown WGFZ model: ${model}`);
  }
  return table;
}

export function interpolateCoefficient(table, wgfz, { extrapolate = false } = {}) {
  assertPositive('wgfz', wgfz);

  const min = table[0];
  const max = table[table.length - 1];

  if (wgfz < min[0]) {
    if (!extrapolate) {
      return {
        coefficient: null,
        inRange: false,
        warning: `WGFZ ${wgfz} liegt unterhalb des Tabellenbereichs ${min[0]}-${max[0]}. Keine stille Kappung.`,
      };
    }

    const [x1, y1] = table[0];
    const [x2, y2] = table[1];

    return {
      coefficient: y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1),
      inRange: false,
      warning: `WGFZ ${wgfz} liegt unterhalb des Tabellenbereichs ${min[0]}-${max[0]}; linear extrapoliert.`,
    };
  }

  if (wgfz > max[0]) {
    if (!extrapolate) {
      return {
        coefficient: null,
        inRange: false,
        warning: `WGFZ ${wgfz} liegt oberhalb des Tabellenbereichs ${min[0]}-${max[0]}. Keine stille Kappung.`,
      };
    }

    const [x1, y1] = table[table.length - 2];
    const [x2, y2] = table[table.length - 1];

    return {
      coefficient: y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1),
      inRange: false,
      warning: `WGFZ ${wgfz} liegt oberhalb des Tabellenbereichs ${min[0]}-${max[0]}; linear extrapoliert.`,
    };
  }

  for (const row of table) {
    if (wgfz === row[0]) {
      return { coefficient: row[1], inRange: true, warning: null };
    }
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const [x1, y1] = table[i];
    const [x2, y2] = table[i + 1];

    if (wgfz >= x1 && wgfz <= x2) {
      return {
        coefficient: y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1),
        inRange: true,
        warning: null,
      };
    }
  }

  throw new Error(`Could not interpolate WGFZ ${wgfz}.`);
}

export function calculateWgfzCorrection({
  model,
  referenceWgfz,
  targetWgfz,
  manualFactor = 1,
  extrapolate = false,
}) {
  assertPositive('referenceWgfz', referenceWgfz);
  assertPositive('targetWgfz', targetWgfz);
  assertPositive('manualFactor', manualFactor);

  const table = getWgfzTable(model);
  const reference = interpolateCoefficient(table, referenceWgfz, { extrapolate });
  const target = interpolateCoefficient(table, targetWgfz, { extrapolate });
  const warnings = [reference.warning, target.warning].filter(Boolean);

  if (reference.coefficient == null || target.coefficient == null) {
    return {
      ok: false,
      model,
      referenceWgfz,
      targetWgfz,
      referenceCoefficient: reference.coefficient,
      targetCoefficient: target.coefficient,
      wgfzFactor: null,
      manualFactor,
      totalFactor: null,
      warnings,
      explanation:
        'WGFZ-Korrektur nicht berechnet, weil mindestens eine WGFZ ausserhalb des Tabellenbereichs liegt.',
    };
  }

  const wgfzFactor = target.coefficient / reference.coefficient;
  const totalFactor = wgfzFactor * manualFactor;

  return {
    ok: true,
    model,
    referenceWgfz,
    targetWgfz,
    referenceCoefficient: round(reference.coefficient, 6),
    targetCoefficient: round(target.coefficient, 6),
    wgfzFactor: round(wgfzFactor, 6),
    manualFactor: round(manualFactor, 6),
    totalFactor: round(totalFactor, 6),
    warnings,
    explanation: `BRW-Korrektur = UK(${targetWgfz}) / UK(${referenceWgfz}) * ${round(
      manualFactor,
      3,
    )} = ${round(totalFactor, 3)}.`,
  };
}

export function calculateTargetWgfz({ relevantGrossFloorArea, plotArea }) {
  assertPositive('relevantGrossFloorArea', relevantGrossFloorArea);
  assertPositive('plotArea', plotArea);
  return round(relevantGrossFloorArea / plotArea, 6);
}
