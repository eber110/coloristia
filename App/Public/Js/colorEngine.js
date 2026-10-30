/**
 * @file colorEngine.js
 * @description Professional chromatic engine for Coloristia.
 * Implements angular normalization, 12 harmony rules, 6-to-16 variation harmonic scaling,
 * parabolic saturation curves, Bezold-Brücke hue micro-rotation, perceptual brightness compensation,
 * conversions across color spaces (HEX, RGB, HSL, HSV, CMYK), and WCAG relative luminance contrast.
 */

/**
 * Normalizes an angle into the circular interval [0, 360).
 *
 * @param {number} theta Angle in degrees.
 * @returns {number} Normalized angle in [0, 360).
 */
export function normHue(theta) {
  return ((theta % 360) + 360) % 360;
}

/**
 * Anchor shift angle definitions for all supported harmony rules.
 */
export const HARMONY_RULES = {
  monochromatic: {
    id: "monochromatic",
    name: "Monocromática",
    k: 1,
    shifts: [0],
    description: "Un solo radio del círculo; varía en luz y saturación."
  },
  complementary: {
    id: "complementary",
    name: "Complementaria",
    k: 2,
    shifts: [0, 180],
    description: "Diámetro opuesto exacto (máximo contraste)."
  },
  analogousStandard: {
    id: "analogousStandard",
    name: "Análoga",
    k: 3,
    shifts: [0, 30, -30],
    description: "Abanico de 60° alrededor del matiz semilla."
  },
  triad: {
    id: "triad",
    name: "Tríada",
    k: 3,
    shifts: [0, 120, 240],
    description: "Triángulo equilátero perfecto (360° / 3)."
  },
  splitComplementary: {
    id: "splitComplementary",
    name: "Complementaria Dividida",
    k: 3,
    shifts: [0, 150, 210],
    description: "Triángulo isósceles; contraste suave."
  },
  analogousExtended: {
    id: "analogousExtended",
    name: "Análoga Extendida",
    k: 5,
    shifts: [0, 25, -25, 50, -50],
    description: "Abanico amplio de 100° totales."
  },
  analogousAccented: {
    id: "analogousAccented",
    name: "Análoga Acentuada",
    k: 4,
    shifts: [0, 30, -30, 180],
    description: "Abanico análogo con acento complementario opuesto."
  },
  tetradRectangular: {
    id: "tetradRectangular",
    name: "Tétrada Rectangular",
    k: 4,
    shifts: [0, 60, 180, 240],
    description: "Dos pares de complementarios separados por 60°."
  },
  tetradSquare: {
    id: "tetradSquare",
    name: "Tétrada Cuadrada",
    k: 4,
    shifts: [0, 90, 180, 270],
    description: "Cuadrado perfecto (360° / 4)."
  },
  pentagon: {
    id: "pentagon",
    name: "Pentágono",
    k: 5,
    shifts: [0, 72, 144, 216, 288],
    description: "Polígono regular de 5 anclas (360° / 5)."
  },
  hexagon: {
    id: "hexagon",
    name: "Hexágono",
    k: 6,
    shifts: [0, 60, 120, 180, 240, 300],
    description: "Polígono regular de 6 anclas (360° / 6)."
  },
  goldenRatio: {
    id: "goldenRatio",
    name: "Proporción Áurea",
    k: null,
    shifts: [],
    dynamic: true,
    description: "Secuencia áurea no repetitiva (ΔH = i × 137.508°)."
  }
};

/**
 * Converts HSL values to RGB values in the [0, 255] range.
 *
 * @param {number} H Hue [0, 360)
 * @param {number} S Saturation [0, 100]
 * @param {number} L Lightness [0, 100]
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(H, S, L) {
  const h = normHue(H);
  const s = Math.max(0, Math.min(100, S)) / 100;
  const l = Math.max(0, Math.min(100, L)) / 100;

  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = C; gPrime = X; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = X; gPrime = C; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = C; bPrime = X;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = X; bPrime = C;
  } else if (h >= 240 && h < 300) {
    rPrime = X; gPrime = 0; bPrime = C;
  } else {
    rPrime = C; gPrime = 0; bPrime = X;
  }

  const r = Math.round(Math.max(0, Math.min(255, (rPrime + m) * 255)));
  const g = Math.round(Math.max(0, Math.min(255, (gPrime + m) * 255)));
  const b = Math.round(Math.max(0, Math.min(255, (bPrime + m) * 255)));

  return { r, g, b };
}

/**
 * Converts RGB [0, 255] to HSL.
 *
 * @param {number} r Red channel [0, 255]
 * @param {number} g Green channel [0, 255]
 * @param {number} b Blue channel [0, 255]
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
  const normR = Math.max(0, Math.min(255, r)) / 255;
  const normG = Math.max(0, Math.min(255, g)) / 255;
  const normB = Math.max(0, Math.min(255, b)) / 255;

  const cMax = Math.max(normR, normG, normB);
  const cMin = Math.min(normR, normG, normB);
  const delta = cMax - cMin;

  let l = ((cMax + cMin) / 2) * 100;
  let s = 0;
  let h = 0;

  if (delta !== 0) {
    s = (delta / (1 - Math.abs(2 * (l / 100) - 1))) * 100;

    if (cMax === normR) {
      h = 60 * (((normG - normB) / delta) % 6);
    } else if (cMax === normG) {
      h = 60 * (((normB - normR) / delta) + 2);
    } else {
      h = 60 * (((normR - normG) / delta) + 4);
    }
  }

  return {
    h: Math.round(normHue(h)),
    s: Math.round(Math.max(0, Math.min(100, s))),
    l: Math.round(Math.max(0, Math.min(100, l)))
  };
}

/**
 * Converts RGB values [0, 255] to uppercase HEX string (#RRGGBB).
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} Uppercase HEX color code.
 */
export function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16).toUpperCase();
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parses a HEX string (#RGB or #RRGGBB) to RGB values.
 *
 * @param {string} hex Hexadecimal string.
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) {
    return { r: 196, g: 33, b: 39 };
  }

  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 196, g: 33, b: 39 };
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Converts HSL to HSV / HSB.
 *
 * @param {number} H
 * @param {number} S
 * @param {number} L
 * @returns {{h: number, s: number, v: number}}
 */
export function hslToHsv(H, S, L) {
  const l = L / 100;
  const s = S / 100;
  const v = l + s * Math.min(l, 1 - l);
  const sHsv = v === 0 ? 0 : 2 * (1 - l / v) * 100;

  return {
    h: Math.round(normHue(H)),
    s: Math.round(Math.max(0, Math.min(100, sHsv))),
    v: Math.round(Math.max(0, Math.min(100, v * 100)))
  };
}

/**
 * Converts RGB to CMYK percentages [0, 100].
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{c: number, m: number, y: number, k: number}}
 */
export function rgbToCmyk(r, g, b) {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const k = 1 - Math.max(normR, normG, normB);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = ((1 - normR - k) / (1 - k)) * 100;
  const m = ((1 - normG - k) / (1 - k)) * 100;
  const y = ((1 - normB - k) / (1 - k)) * 100;

  return {
    c: Math.round(Math.max(0, Math.min(100, c))),
    m: Math.round(Math.max(0, Math.min(100, m))),
    y: Math.round(Math.max(0, Math.min(100, y))),
    k: Math.round(Math.max(0, Math.min(100, k * 100)))
  };
}

/**
 * Computes WCAG relative luminance from RGB channels.
 *
 * @param {number} r Red channel [0, 255]
 * @param {number} g Green channel [0, 255]
 * @param {number} b Blue channel [0, 255]
 * @returns {number} Relative luminance Y [0, 1]
 */
export function getRelativeLuminance(r, g, b) {
  const linearize = (c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const rLin = linearize(r);
  const gLin = linearize(g);
  const bLin = linearize(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Determines optimal text color to ensure WCAG compliant contrast.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} "#18181B" for light background, or "#FFFFFF" for dark background.
 */
export function getAccessibleTextColor(r, g, b) {
  const Y = getRelativeLuminance(r, g, b);
  return Y > 0.179 ? "#18181B" : "#FFFFFF";
}

/**
 * Formats a color object according to the selected color system.
 *
 * @param {Object} color Color object with h, s, l, r, g, b, hex fields.
 * @param {string} system 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
 * @returns {string} Formatted string for UI representation.
 */
export function formatColorValue(color, system = "hex") {
  const sys = (system || "hex").toLowerCase();
  switch (sys) {
    case "rgb":
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    case "hsl":
      return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
    case "hsv": {
      const hsv = hslToHsv(color.h, color.s, color.l);
      return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
    }
    case "cmyk": {
      const cmyk = rgbToCmyk(color.r, color.g, color.b);
      return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
    }
    case "hex":
    default:
      return color.hex;
  }
}

/**
 * Generates an N-color palette following harmonic geometry and dynamic scaling rules.
 *
 * @param {number} H0 Seed hue [0, 360)
 * @param {number} S0 Seed saturation [0, 100]
 * @param {number} L0 Seed lightness [0, 100]
 * @param {string} harmonyKey Harmony identifier (e.g., 'monochromatic', 'complementary')
 * @param {number} N Total variations count (clamped between 6 and 16)
 * @param {string} sortMode 'family' (anchor grouped gradient) or 'luminance' (global gradient)
 * @returns {Array<Object>} Generated color palette objects.
 */
export function generatePalette(H0, S0, L0, harmonyKey = "monochromatic", N = 6, sortMode = "family") {
  const clampedN = Math.max(6, Math.min(16, Math.round(N)));
  const harmony = HARMONY_RULES[harmonyKey] || HARMONY_RULES.monochromatic;

  let shifts = [];
  let K = 1;

  if (harmony.dynamic) {
    // Golden ratio sequence: delta H_i = i * 137.508°
    K = Math.min(clampedN, 5);
    shifts = [];
    for (let i = 0; i < K; i++) {
      shifts.push(normHue(i * 137.508));
    }
  } else {
    shifts = [...harmony.shifts];
    K = harmony.k;
  }

  // Step 1: Distribution of slots per anchor
  let effectiveK = K;
  let activeShifts = shifts;

  if (clampedN < K) {
    effectiveK = clampedN;
    activeShifts = shifts.slice(0, clampedN);
  }

  const Q = Math.floor(clampedN / effectiveK);
  const Rmod = clampedN % effectiveK;

  const anchorCounts = [];
  for (let j = 0; j < effectiveK; j++) {
    anchorCounts.push(j < Rmod ? Q + 1 : Q);
  }

  // Step 2: Calculate L, S, and Bezold-Brücke micro-rotation per anchor
  const colors = [];

  for (let j = 0; j < effectiveK; j++) {
    const Mj = anchorCounts[j];
    const deltaH = activeShifts[j];

    for (let m = 0; m < Mj; m++) {
      let Ljm;
      if (Mj === 1) {
        Ljm = L0;
      } else {
        const Lmin = 18;
        const Lmax = 90;
        const deltaL = (Lmax - Lmin) / (Mj - 1);
        Ljm = Lmin + (m * deltaL);
      }

      // Parabolic saturation curve
      const Dcentro = Math.abs(Ljm - 50) / 50;
      const Sjm = Math.max(15, S0 * (1 - 0.45 * Math.pow(Dcentro, 2)));

      // Bezold-Brücke effect: natural hue rotation (±6°)
      const microShift = ((Ljm - 50) / 50) * 6;
      let Hjm = normHue(H0 + deltaH + microShift);

      // Perceptual brightness compensation for single-anchor yellows/limes/cyans
      if (Mj === 1 && Hjm >= 45 && Hjm <= 160) {
        const factor = Math.max(0, Math.sin(((Hjm - 45) / 115) * Math.PI));
        Ljm = Math.max(10, Ljm - 8 * factor);
      }

      // Convert to RGB and other formats
      const rgb = hslToRgb(Hjm, Sjm, Ljm);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const Y = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
      const textColor = getAccessibleTextColor(rgb.r, rgb.g, rgb.b);

      colors.push({
        anchorIndex: j,
        toneIndex: m,
        h: Math.round(Hjm),
        s: Math.round(Sjm),
        l: Math.round(Ljm),
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        hex: hex,
        luminance: Y,
        textColor: textColor
      });
    }
  }

  // Final sorting
  if (sortMode === "luminance") {
    // Global gradient view: sort by relative luminance Y descending
    colors.sort((a, b) => b.luminance - a.luminance);
  } else {
    // Grouped by anchor families in smooth gradient order (Lmin -> Lmax)
  }

  return colors;
}

/**
 * Generates all harmony palettes for a given seed color.
 *
 * @param {string} seedHex Seed color in HEX (e.g., #C42127)
 * @param {number} variations Variation count (6 to 16)
 * @param {string} sortMode Sort mode ('family' or 'luminance')
 * @returns {Object} Complete map of harmonies with rule metadata and color arrays.
 */
export function generateAllHarmonies(seedHex, variations = 6, sortMode = "family") {
  const rgb = hexToRgb(seedHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const results = {};
  for (const [key, rule] of Object.entries(HARMONY_RULES)) {
    results[key] = {
      rule: rule,
      colors: generatePalette(hsl.h, hsl.s, hsl.l, key, variations, sortMode)
    };
  }

  return {
    seed: {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb: rgb,
      hsl: hsl,
      textColor: getAccessibleTextColor(rgb.r, rgb.g, rgb.b)
    },
    variations: variations,
    harmonies: results
  };
}
