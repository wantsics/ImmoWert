// WGFZ correction core for Stuttgart Bodenrichtwerte.
// Pure calculation module: no DOM, no UI side effects.
//
// Fachlogik:
// adjusted BRW = BRW * UK(WGFZ_target) / UK(WGFZ_reference)
//
// source basis: Grundstücksmarktbericht Stuttgart 2024, section 6.4.4.
// Important: values outside the published table range must not be silently clamped.
// The market report states that extrapolation outside the shown ranges requires
// expert judgement. Therefore this module makes extrapolation/warnings explicit.

export const WGFZ_MODELS = Object.freeze({
  LOWRISE: 'lowrise',
  MULTI: 'multi',
});

export const WGFZ_TABLES = Object.freeze({
  [WGFZ_MODELS.LOWRISE]: Object.freeze([
    [0.3, 0.69],
    [0.4, 0.75],
    [0.5, 0.80],
    [0.6, 0.84],
    [0.7, 0.88],
    [0.8, 0.92],
    [0.9, 0.96],
    [1.0, 1.00],
    [1.1, 1.05],
  ]),
  [WGFZ_MODELS.MULTI]: Object.freeze([
    [0.8, 0.94],
    [0.9, 0.97],
    [1.0, 1.00],
    [1.1, 1.03],
    [1.2, 1.07],
    [1.3, 1.10],
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

function assertNumber(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
}

export function getWgfzTable(model) {
  const table = WGFZ_TABLES[model];
  if (!table) {
    throw new Error(`Unknown WGFZ model: ${model}`);
  }
  return table;
}

export function interpolateCoefficient(table, wgfz, options = {}) {
  const { extrapolate = false } = options;
  assertNumber('wgfz', wgfz);

  const min = table[0];
  const max = table[table.length - 1];

  if (wgfz < min[0]) {
    if (!extrapolate) {
      return {
        coefficient: null,
        inRange: false,
        warning: `WGFZ ${wgfz} is below published table range ${min[0]}-${max[0]}. No silent clamping applied.`,
      };
    }
    const [x1, y1] = table[0];
    const [x2, y2] = table[1];
    const coefficient = y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1);
    return {
      coefficient,
      inRange: false,
      warning: `WGFZ ${wgfz} is below published table range ${min[0]}-${max[0]}; coefficient extrapolated linearly. Expert judgement required.`,
    };
  }

  if (wgfz > max[0]) {
    if (!extrapolate) {
      return {
        coefficient: null,
        inRange: false,
        warning: `WGFZ ${wgfz} is above published table range ${min[0]}-${max[0]}. No silent clamping applied.`,
      };
    }
    const [x1, y1] = table[table.length - 2];
    const [x2, y2] = table[table.length - 1];
    const coefficient = y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1);
    return {
      coefficient,
      inRange: false,
      warning: `WGFZ ${wgfz} is above published table range ${min[0]}-${max[0]}; coefficient extrapolated linearly. Expert judgement required.`,
    };
  }

  for (let i = 0; i < table.length; i += 1) {
    if (wgfz === table[i][0]) {
      return { coefficient: table[i][1], inRange: true, warning: null };
    }
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const [x1, y1] = table[i];
    const [x2, y2] = table[i + 1];
    if (wgfz >= x1 && wgfz <= x2) {
      const coefficient = y1 + ((y2 - y1) * (wgfz - x1)) / (x2 - x1);
      return { coefficient, inRange: true, warning: null };
    }
  }

  throw new Error(`Could not interpolate WGFZ ${wgfz}.`);
}

export function calculateWgfzCorrection(input) {
  const {
    model,
    referenceWgfz,
    targetWgfz,
    manualFactor = 1,
    extrapolate = false,
  } = input;

  assertNumber('referenceWgfz', referenceWgfz);
  assertNumber('targetWgfz', targetWgfz);
  assertNumber('manualFactor', manualFactor);

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
      explanation: `WGFZ correction not calculated because at least one WGFZ is outside the published range and extrapolate=false.`,
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
    explanation: `BRW correction = UK(target ${targetWgfz}) / UK(reference ${referenceWgfz}) * manual factor = ${round(target.coefficient, 3)} / ${round(reference.coefficient, 3)} * ${round(manualFactor, 3)} = ${round(totalFactor, 3)}.`,
  };
}

export function calculateTargetWgfz({ relevantGrossFloorArea, plotArea }) {
  assertNumber('relevantGrossFloorArea', relevantGrossFloorArea);
  assertNumber('plotArea', plotArea);
  return round(relevantGrossFloorArea / plotArea, 6);
}
