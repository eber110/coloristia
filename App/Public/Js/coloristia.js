/**
 * @file coloristia.js
 * @description Unified color engine and UI orchestrator for Coloristia.
 * Includes chromatic normalization, 12 geometric harmonies, dynamic scaling (6 to 16 colors),
 * parabolic saturation, Bezold-Brücke hue micro-rotation, color space conversions (HEX, RGB, HSL, HSV, CMYK),
 * WCAG accessible contrast calculations, clipboard copy, SQLite persistence, and UI events.
 */

// =========================================================================
// SECTION 1: CHROMATIC MATH & SCALING ENGINE
// =========================================================================

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
 * Converts normalized HSV (H: [0, 360), S: [0, 1], V: [0, 1]) to RGB [0, 255].
 *
 * @param {number} h Hue in degrees [0, 360)
 * @param {number} s Saturation [0, 1]
 * @param {number} v Value [0, 1]
 * @returns {{r: number, g: number, b: number}}
 */
export function hsvNormToRgb(h, s, v) {
  const normH = normHue(h);
  const normS = Math.max(0, Math.min(1, s));
  const normV = Math.max(0, Math.min(1, v));

  const C = normV * normS;
  const X = C * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normV - C;

  let rPrime = 0, gPrime = 0, bPrime = 0;
  if (normH >= 0 && normH < 60) {
    rPrime = C; gPrime = X; bPrime = 0;
  } else if (normH >= 60 && normH < 120) {
    rPrime = X; gPrime = C; bPrime = 0;
  } else if (normH >= 120 && normH < 180) {
    rPrime = 0; gPrime = C; bPrime = X;
  } else if (normH >= 180 && normH < 240) {
    rPrime = 0; gPrime = X; bPrime = C;
  } else if (normH >= 240 && normH < 300) {
    rPrime = X; gPrime = 0; bPrime = C;
  } else {
    rPrime = C; gPrime = 0; bPrime = X;
  }

  return {
    r: Math.round(Math.max(0, Math.min(255, (rPrime + m) * 255))),
    g: Math.round(Math.max(0, Math.min(255, (gPrime + m) * 255))),
    b: Math.round(Math.max(0, Math.min(255, (bPrime + m) * 255)))
  };
}

/**
 * Converts RGB [0, 255] to normalized HSV (H: [0, 360), S: [0, 1], V: [0, 1]).
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{h: number, s: number, v: number}}
 */
export function rgbToHsvNorm(r, g, b) {
  const normR = Math.max(0, Math.min(255, r)) / 255;
  const normG = Math.max(0, Math.min(255, g)) / 255;
  const normB = Math.max(0, Math.min(255, b)) / 255;

  const cMax = Math.max(normR, normG, normB);
  const cMin = Math.min(normR, normG, normB);
  const delta = cMax - cMin;

  let h = 0;
  if (delta !== 0) {
    if (cMax === normR) {
      h = 60 * (((normG - normB) / delta) % 6);
    } else if (cMax === normG) {
      h = 60 * (((normB - normR) / delta) + 2);
    } else {
      h = 60 * (((normR - normG) / delta) + 4);
    }
  }

  const s = cMax === 0 ? 0 : delta / cMax;
  const v = cMax;

  return {
    h: normHue(h),
    s: Math.max(0, Math.min(1, s)),
    v: Math.max(0, Math.min(1, v))
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
 * Calculates WCAG contrast ratio against text color.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {string} textColor "#18181B" or "#FFFFFF"
 * @returns {{ratio: number, level: string}}
 */
export function getWcagContrast(r, g, b, textColor) {
  const isDarkText = textColor === "#18181B";
  const bgLum = getRelativeLuminance(r, g, b);
  const textLum = isDarkText ? getRelativeLuminance(24, 24, 27) : 1.0;
  const L1 = Math.max(bgLum, textLum);
  const L2 = Math.min(bgLum, textLum);
  const ratio = (L1 + 0.05) / (L2 + 0.05);
  const rounded = Math.round(ratio * 10) / 10;
  const level = rounded >= 7 ? "AAA" : (rounded >= 4.5 ? "AA" : (rounded >= 3 ? "AA+" : "A"));
  return { ratio: rounded, level: level };
}

/**
 * Updates dynamic ambient mesh glow colors based on current seed color.
 *
 * @param {string} hex
 */
export function updateAmbientLighting(hex) {
  try {
    if (typeof document === "undefined") return;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Complementary color for secondary ambient glow
    const compHue = (hsl.h + 160) % 360;
    const compRgb = hslToRgb(compHue, Math.min(hsl.s, 72), Math.max(hsl.l, 40));
    const compHex = rgbToHex(compRgb.r, compRgb.g, compRgb.b);

    // Warm/cool analog tone for tertiary ambient glow (desktop depth)
    const tertHue = (hsl.h + 50) % 360;
    const tertRgb = hslToRgb(tertHue, Math.min(hsl.s, 65), Math.max(hsl.l, 38));
    const tertHex = rgbToHex(tertRgb.r, tertRgb.g, tertRgb.b);

    document.documentElement.style.setProperty("--ambient-primary", hex);
    document.documentElement.style.setProperty("--ambient-secondary", compHex);
    document.documentElement.style.setProperty("--ambient-tertiary", tertHex);
  } catch (_) {}
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
 * Generates an N-color harmony palette dynamically scaled and nuanced according to the seed color's
 * exact Hue, Saturation, and Brightness (HSV model).
 *
 * @param {number} H0 Seed hue [0, 360)
 * @param {number} S0 Seed saturation [0, 1] (or [0, 100])
 * @param {number} V0 Seed brightness/value [0, 1] (or [0, 100])
 * @param {string} harmonyKey Harmony identifier (e.g., 'monochromatic', 'complementary')
 * @param {number} N Total variations count (clamped between 6 and 16)
 * @param {string} sortMode 'family' (anchor grouped gradient) or 'luminance' (global gradient)
 * @returns {Array<Object>} Generated color palette objects.
 */
export function generatePalette(H0, S0, V0, harmonyKey = "monochromatic", N = 6, sortMode = "family") {
  const clampedN = Math.max(6, Math.min(16, Math.round(N)));
  const harmony = HARMONY_RULES[harmonyKey] || HARMONY_RULES.monochromatic;

  // Normalize S0 and V0 to [0, 1] regardless of whether caller passed 0-1 or 0-100
  const normS0 = Math.max(0, Math.min(1, S0 > 1 ? S0 / 100 : S0));
  const normV0 = Math.max(0, Math.min(1, V0 > 1 ? V0 / 100 : V0));

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

  // Step 2: Calculate V, S, and Bezold-Brücke micro-rotation per anchor
  const colors = [];

  // Check if color is neutral grayscale (grays, black, white)
  const isAchromatic = normS0 <= 0.02;

  // Dynamic brightness bounds directly responsive to seed brightness (normV0)
  // Ensures darkest swatch is deep and rich (Vmin: 0.10-0.16) and lightest swatch reaches high luminosity (Vmax: 0.98)
  const Vmin = 0.10 + 0.06 * normV0;
  const Vmax = 0.98;

  for (let j = 0; j < effectiveK; j++) {
    const Mj = anchorCounts[j];
    const deltaH = activeShifts[j];
    const baseHue = normHue(H0 + deltaH);

    for (let m = 0; m < Mj; m++) {
      let Vjm;
      let Sjm;
      let Hjm;

      if (Mj === 1) {
        Vjm = normV0;
        Sjm = normS0;
        Hjm = baseHue;
      } else {
        const t = m / (Mj - 1); // 0.0 (darkest) to 1.0 (lightest)

        // Interpolate brightness smoothly based on the seed's dynamic range
        Vjm = Vmin + (Vmax - Vmin) * t;

        // Nuanced saturation curve directly scaled by the seed's saturation (normS0)
        // At t=0 (dark shade): moderate saturation preserves deep tone
        // At mid t: reaches full seed vibrancy
        // At t=1 (light tint): tapers down to a luminous delicate wash near white
        if (isAchromatic) {
          Sjm = 0;
        } else if (t <= 0.45) {
          const u = t / 0.45;
          Sjm = normS0 * (0.65 + 0.35 * Math.sin((Math.PI / 2) * u));
        } else {
          const u = (t - 0.45) / 0.55;
          Sjm = normS0 * (0.08 + 0.92 * Math.cos((Math.PI / 2) * u));
        }

        // Bezold-Brücke natural hue micro-rotation (±3°)
        const microShift = isAchromatic ? 0 : (t - 0.5) * 6;
        Hjm = normHue(baseHue + microShift);
      }

      // Convert HSV to RGB and HSL
      const rgb = hsvNormToRgb(Hjm, Sjm, Vjm);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const Y = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
      const textColor = getAccessibleTextColor(rgb.r, rgb.g, rgb.b);

      colors.push({
        anchorIndex: j,
        toneIndex: m,
        h: Math.round(Hjm),
        s: hsl.s,
        l: hsl.l,
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
    colors.sort((a, b) => b.luminance - a.luminance);
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
  const hsv = rgbToHsvNorm(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const results = {};
  for (const [key, rule] of Object.entries(HARMONY_RULES)) {
    results[key] = {
      rule: rule,
      colors: generatePalette(hsv.h, hsv.s, hsv.v, key, variations, sortMode)
    };
  }

  return {
    seed: {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb: rgb,
      hsv: hsv,
      hsl: hsl,
      textColor: getAccessibleTextColor(rgb.r, rgb.g, rgb.b)
    },
    variations: variations,
    harmonies: results
  };
}

// =========================================================================
// SECTION 2: FRONTEND UI & INTERACTION ORCHESTRATOR
// =========================================================================

/**
 * Global reactive application state.
 */
const state = {
  currentColor: "#C42127",
  defaultColor: "#C42127",
  activeSlot: "default",
  userPalettes: [],
  variations: 15,
  colorSystem: "hex",
  isLoggedIn: false,
  projects: [],
  isLoadingProjects: false,
  selectedHarmonyFilter: "primary",
  mobileSelectedHarmony: "monochromatic",
  activeHarmony: "monochromatic",
  exportTarget: "all",
  isInitialRender: true,
  exportFormat: "css",
  get loadedPalette() {
    return this.userPalettes.length > 0 ? {
      id: this.userPalettes[0].id,
      project_name: this.userPalettes[0].name,
      hex_color: this.userPalettes[0].hex
    } : null;
  },
  set loadedPalette(val) {
    if (!val || !val.hex_color) {
      this.userPalettes = [];
      this.activeSlot = "default";
      saveUserPalettesToStorage();
    } else {
      this.userPalettes = [{
        id: val.id || null,
        name: val.project_name || "Paleta fijada",
        hex: val.hex_color
      }];
      this.activeSlot = 0;
      saveUserPalettesToStorage();
    }
  }
};

export const MAX_USER_PALETTES = 5;

/**
 * Normalizes any valid 3-digit or 6-digit HEX string to uppercase 6-digit '#RRGGBB'.
 *
 * @param {string} hex
 * @returns {string|null}
 */
export function normalizeHex6(hex) {
  let clean = String(hex || "").trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return "#" + clean.toUpperCase();
  }
  return null;
}

/**
 * Saves loaded user palettes in localStorage memory.
 */
export function saveUserPalettesToStorage() {
  try {
    localStorage.setItem("coloristia_user_palettes", JSON.stringify(state.userPalettes));
  } catch (_) {}
}

/**
 * Loads saved user palettes from localStorage memory.
 */
export function loadUserPalettesFromStorage() {
  try {
    const raw = localStorage.getItem("coloristia_user_palettes");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.userPalettes = parsed.filter((p) => p && typeof p.hex === "string").slice(0, MAX_USER_PALETTES);
      }
    }
  } catch (_) {}
}

/**
 * Escapes special HTML characters to prevent XSS.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Displays a non-intrusive toast notification using framework toast or fallback.
 *
 * @param {string} message Message text to display.
 * @param {string} type 'success' | 'error' | 'info' | 'warning'
 */
export function showToast(message, type = "success") {
  if (typeof window.toast === "function") {
    window.toast(message, type, 3000, true);
    return;
  }

  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast toast-${type} animate-fade-in`;
  toastEl.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.add("toast-exit");
    setTimeout(() => toastEl.remove(), 300);
  }, 2800);
}

/**
 * Retrieves the CSRF token from the meta tag in the HTML head.
 *
 * @returns {string}
 */
export function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : "";
}

/**
 * Copies text to the clipboard and provides user feedback.
 *
 * @param {string} text Text to copy.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    showToast(`¡Copiado al portapapeles: ${text}!`, "success");
  } catch (err) {
    showToast(`Copiado: ${text}`, "info");
  }
}

/**
 * Helper to apply dynamic shadow and border to circle swatches based on color brightness.
 *
 * @param {HTMLElement} el
 * @param {string} hex
 * @param {boolean} isActive
 */
function applySwatchShadow(el, hex, isActive) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (hsl.l >= 98) {
    el.style.boxShadow = isActive
      ? "0 10px 40px -10px rgba(255,255,255,0.7), 0 0 35px rgba(255,255,255,0.5)"
      : "0 6px 20px -6px rgba(255,255,255,0.4)";
    el.style.borderColor = "#ffffff";
  } else if (hsl.l <= 2) {
    el.style.boxShadow = isActive
      ? "0 10px 40px -10px rgba(0,0,0,0.9), 0 0 25px rgba(255,255,255,0.15)"
      : "0 6px 20px -6px rgba(0,0,0,0.7)";
    el.style.borderColor = "rgba(255, 255, 255, 0.4)";
  } else {
    el.style.boxShadow = isActive
      ? `0 10px 40px -10px ${hex}88, 0 0 25px ${hex}44`
      : `0 8px 25px -8px ${hex}77, 0 0 15px ${hex}33`;
    el.style.borderColor = isActive ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.75)";
  }
}

/**
 * Renders the hero seed swatches (default working color + up to 5 user loaded palettes, max 6 total colors).
 */
export function renderHeroSeed(options = {}) {
  const seedsTrack = document.getElementById("heroSeedsTrack");
  const baseColorLabel = document.getElementById("baseColorLabel");
  const quickColorTrigger = document.getElementById("quickColorTrigger");
  const quickColorCircle = document.getElementById("quickColorCircle");
  const clearPinnedBtn = document.getElementById("clearPinnedBtn");

  const activeHex = state.currentColor || state.defaultColor;
  const rgb = hexToRgb(activeHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const isPureBlackOrWhite = hsl.l <= 2 || hsl.l >= 98;

  if (baseColorLabel) {
    baseColorLabel.textContent = isPureBlackOrWhite ? `${activeHex} (Neutro)` : activeHex;
  }
  if (quickColorTrigger) {
    quickColorTrigger.style.backgroundColor = activeHex;
    quickColorTrigger.style.boxShadow = `0 0 14px ${activeHex}88`;
  }
  if (quickColorCircle) {
    quickColorCircle.style.backgroundColor = activeHex;
  }

  // 1. User Palettes (up to 5) + 1 Default Working Color = Max 6 colors
  const userPalettes = (state.userPalettes || []).slice(0, MAX_USER_PALETTES);

  // Validate activeSlot boundaries
  if (typeof state.activeSlot === "number" && (state.activeSlot < 0 || state.activeSlot >= userPalettes.length)) {
    state.activeSlot = "default";
    state.currentColor = state.defaultColor;
  }

  // "el menu de borrar colores debe desaparecer si solo tenemos 1 color cargado"
  // (only appears if there are user palettes loaded alongside default color)
  if (clearPinnedBtn) {
    clearPinnedBtn.style.display = userPalettes.length > 0 ? "inline-flex" : "none";
  }

  if (!seedsTrack || options.skipTrackRebuild) return;

  // Distribute palettes around the default color (left & right) as in user diagram:
  // e.g. 5 user palettes: 2 left, 1 default center, 3 right (total 6 swatches).
  let leftCount = 0;
  if (userPalettes.length === 1) leftCount = 1;
  else if (userPalettes.length === 2) leftCount = 1;
  else if (userPalettes.length === 3) leftCount = 2;
  else if (userPalettes.length === 4) leftCount = 2;
  else if (userPalettes.length === 5) leftCount = 2;

  const leftList = userPalettes.slice(0, leftCount).map((p, i) => ({ ...p, originalIndex: i }));
  const rightList = userPalettes.slice(leftCount).map((p, i) => ({ ...p, originalIndex: leftCount + i }));

  const defaultItem = {
    isDefault: true,
    hex: state.defaultColor,
    name: "Color base"
  };

  const fullList = [
    ...leftList.map((p) => ({ ...p, isDefault: false })),
    defaultItem,
    ...rightList.map((p) => ({ ...p, isDefault: false }))
  ];

  seedsTrack.innerHTML = fullList.map((item) => {
    if (item.isDefault) {
      const isDefaultActive = state.activeSlot === "default";
      return `
        <div id="heroDefaultSeedItem" class="hero-seed-item">
          ${!isDefaultActive ? `<button type="button" class="pill-go-to-palette" data-action="activate-default" title="Ir al color base">Color base</button>` : ""}
          <button type="button"
                  id="heroColorSwatch"
                  class="hero-color-circle ${isDefaultActive ? "hero-circle-active" : ""}"
                  data-action="circle-default"
                  data-hex="${state.defaultColor}"
                  style="background-color: ${state.defaultColor}; border: none; cursor: pointer;"
                  title="Haz clic para seleccionar o usar el color base"
                  aria-label="Abrir selector para color base ${state.defaultColor}">
          </button>
          <div class="hero-seed-label-wrap">
            <button type="button" id="heroColorLabel" class="hero-seed-hex-btn font-mono" data-action="activate-default" title="Haz clic para seleccionar o usar el color base">${state.defaultColor}</button>
            <div class="hero-seed-underline"></div>
          </div>
        </div>
      `;
    }

    const isPalActive = state.activeSlot === item.originalIndex;
    return `
      <div class="hero-seed-item hero-user-palette-item" data-index="${item.originalIndex}">
        ${!isPalActive ? `<button type="button" class="pill-go-to-palette" data-action="activate-user" data-index="${item.originalIndex}" title="Ir a esta paleta">Ir a la paleta</button>` : ""}
        <div class="hero-color-circle hero-loaded-circle ${isPalActive ? "hero-circle-active" : ""}"
             data-action="circle-user"
             data-index="${item.originalIndex}"
             data-hex="${item.hex}"
             style="background-color: ${item.hex};"
             title="${escapeHtml(item.name || item.hex)}. Haz clic para usarla.">
          <div class="hero-loaded-actions flex-row items-center justify-center gap8">
            <button type="button" class="hero-loaded-action-btn hero-loaded-dismiss-btn" data-action="dismiss-user" data-index="${item.originalIndex}" title="Quitar del panel" aria-label="Cerrar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="hero-seed-label-wrap">
          <button type="button" class="hero-seed-hex-btn font-mono" data-action="activate-user" data-index="${item.originalIndex}" title="${escapeHtml(item.name || item.hex)}">${item.hex}</button>
          <div class="hero-seed-underline"></div>
        </div>
      </div>
    `;
  }).join("");

  // Apply luminous swatch shadow & borders
  seedsTrack.querySelectorAll(".hero-color-circle").forEach((circle) => {
    const hex = circle.dataset.hex;
    const isAct = circle.classList.contains("hero-circle-active");
    if (hex) {
      applySwatchShadow(circle, hex, isAct);
    }
  });
}

/**
 * Creates a single color card element.
 *
 * @param {object} colorObj
 * @param {boolean} isColumnDisabled
 * @param {number} index
 * @param {string|null} animMode 'initial' | 'add' | null
 * @returns {HTMLButtonElement}
 */
function createColorCard(colorObj, isColumnDisabled, index, animMode = null) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "color-card";
  if (animMode === "initial") {
    card.classList.add("card-initial-appear");
  } else if (animMode === "add") {
    card.classList.add("card-animate-in");
  }

  card.style.backgroundColor = colorObj.hex;
  card.style.color = colorObj.textColor;
  card.style.setProperty("--card-index", index);

  if (isColumnDisabled) {
    card.setAttribute("disabled", "true");
    card.setAttribute("aria-disabled", "true");
    card.title = "Esta paleta está desactivada para tonos neutros.";
  }

  const formatted = formatColorValue(colorObj, state.colorSystem);
  const wcag = getWcagContrast(colorObj.r, colorObj.g, colorObj.b, colorObj.textColor);
  card.dataset.formattedColor = formatted;
  card.innerHTML = `
    <span class="color-value font-mono">${formatted}</span>
    <span class="copy-hint">${isColumnDisabled ? "Inactiva" : "Copiar"}</span>
    <span class="card-wcag-badge" title="Ratio WCAG: ${wcag.ratio}:1 (${wcag.level})">${wcag.level}</span>
  `;

  card.addEventListener("click", () => {
    if (card.disabled || card.getAttribute("aria-disabled") === "true") return;
    const copyHint = card.querySelector(".copy-hint");
    card.classList.add("is-copied");
    if (copyHint) copyHint.textContent = "✓ Copiado";
    copyToClipboard(card.dataset.formattedColor || formatted);
    setTimeout(() => {
      card.classList.remove("is-copied");
      if (copyHint) copyHint.textContent = isColumnDisabled ? "Inactiva" : "Copiar";
    }, 1100);
  });

  return card;
}

/**
 * Renders chromatic harmonies grid and hero preview.
 *
 * @param {object} [options]
 * @param {boolean} [options.isInitial]
 * @param {string|null} [options.variationChange]
 * @param {boolean} [options.skipHeroRebuild]
 */
export function renderHarmonies(options = {}) {
  const data = generateAllHarmonies(state.currentColor, state.variations, "family");

  // Update dynamic ambient background lighting
  updateAmbientLighting(state.currentColor);

  // Update export preview if open
  if (document.getElementById("exportModal")?.classList.contains("is-active")) {
    renderExportCode();
  }

  // Update hero swatches and labels
  renderHeroSeed({ skipTrackRebuild: !!options.skipHeroRebuild });

  // Update harmonic text colors card (darkest and lightest tones of chosen palette)
  renderTextColorsCard(data);

  const projectNameInput = document.getElementById("projectNameInput");
  if (projectNameInput && (!projectNameInput.value || projectNameInput.dataset.auto === "true")) {
    projectNameInput.value = `Paleta Base ${data.seed.hex}`;
    projectNameInput.dataset.auto = "true";
  }

  const isPureBlackOrWhite = (data.seed.hsl.l <= 2) || (data.seed.hsl.l >= 98);

  const primaryKeys = [
    "monochromatic",
    "complementary",
    "analogousStandard",
    "triad",
    "splitComplementary"
  ];

  const extraKeys = [
    "analogousExtended",
    "analogousAccented",
    "tetradRectangular",
    "tetradSquare",
    "pentagon",
    "hexagon",
    "goldenRatio"
  ];

  const allKeys = [
    "monochromatic",
    "complementary",
    "analogousStandard",
    "triad",
    "splitComplementary",
    "analogousExtended",
    "analogousAccented",
    "tetradRectangular",
    "tetradSquare",
    "pentagon",
    "hexagon",
    "goldenRatio"
  ];

  const targetKeys = state.selectedHarmonyFilter === "extra"
    ? extraKeys
    : (state.selectedHarmonyFilter === "all" ? allKeys : primaryKeys);

  const container = document.getElementById("harmoniesGrid");
  if (!container) return;

  const isInitial = options.isInitial || state.isInitialRender;
  const variationChange = options.variationChange || null;

  // Check if existing columns match all keys
  const existingColumns = container.querySelectorAll(".harmony-column");
  const columnKeyMap = {};
  existingColumns.forEach((col) => {
    if (col.dataset.harmonyKey) {
      columnKeyMap[col.dataset.harmonyKey] = col;
    }
  });

  const columnsMatch = allKeys.length === existingColumns.length &&
    allKeys.every((k) => !!columnKeyMap[k]);

  if (!columnsMatch) {
    container.innerHTML = "";
    allKeys.forEach((key) => {
      const item = data.harmonies[key];
      if (!item) return;

      const isColumnDisabled = isPureBlackOrWhite && key !== "monochromatic";
      const isDesktopVisible = targetKeys.includes(key);
      const isMobileVisible = key === state.mobileSelectedHarmony;

      const column = document.createElement("div");
      column.className = `harmony-column flex-column gap12 ${isColumnDisabled ? "harmony-column-disabled" : ""} ${!isDesktopVisible ? "desktop-hidden" : ""} ${isMobileVisible ? "is-mobile-visible" : ""}`;
      column.dataset.harmonyKey = key;

      const title = document.createElement("h3");
      title.className = "harmony-title text-center";
      if (isColumnDisabled) {
        title.innerHTML = `${item.rule.name} <span class="badge-disabled">(Desactivada)</span>`;
      } else if (isPureBlackOrWhite && key === "monochromatic") {
        title.innerHTML = `${item.rule.name} <span class="badge-mono">(Modo Neutro)</span>`;
      } else {
        title.textContent = item.rule.name;
      }
      column.appendChild(title);

      const cardsContainer = document.createElement("div");
      cardsContainer.className = "cards-stack flex-column gap8 w100";

      item.colors.forEach((colorObj, m) => {
        const card = createColorCard(colorObj, isColumnDisabled, m, isInitial ? "initial" : null);
        cardsContainer.appendChild(card);
      });

      column.appendChild(cardsContainer);
      container.appendChild(column);
    });
  } else {
    // Columns already exist: update existing cards in place without destroying DOM!
    allKeys.forEach((key) => {
      const item = data.harmonies[key];
      const column = columnKeyMap[key];
      if (!item || !column) return;

      const isColumnDisabled = isPureBlackOrWhite && key !== "monochromatic";
      if (isColumnDisabled) {
        column.classList.add("harmony-column-disabled");
      } else {
        column.classList.remove("harmony-column-disabled");
      }

      const isDesktopVisible = targetKeys.includes(key);
      const isMobileVisible = key === state.mobileSelectedHarmony;
      column.classList.toggle("desktop-hidden", !isDesktopVisible);
      column.classList.toggle("is-mobile-visible", isMobileVisible);

      // Clean up any col-header if present from previous DOM state
      const oldHeader = column.querySelector(".harmony-col-header");
      if (oldHeader) {
        const oldTitle = oldHeader.querySelector(".harmony-title");
        if (oldTitle) {
          oldTitle.className = "harmony-title text-center";
          column.prepend(oldTitle);
        }
        oldHeader.remove();
      }

      const title = column.querySelector(".harmony-title");
      if (title) {
        title.className = "harmony-title text-center";
        if (isColumnDisabled) {
          title.innerHTML = `${item.rule.name} <span class="badge-disabled">(Desactivada)</span>`;
        } else if (isPureBlackOrWhite && key === "monochromatic") {
          title.innerHTML = `${item.rule.name} <span class="badge-mono">(Modo Neutro)</span>`;
        } else {
          title.textContent = item.rule.name;
        }
      }

      const cardsContainer = column.querySelector(".cards-stack");
      if (!cardsContainer) return;

      const existingCards = cardsContainer.children;
      const existingCount = existingCards.length;
      const newCount = item.colors.length;

      // Update existing cards
      item.colors.forEach((colorObj, m) => {
        const formatted = formatColorValue(colorObj, state.colorSystem);
        if (m < existingCount) {
          const card = existingCards[m];
          card.style.backgroundColor = colorObj.hex;
          card.style.color = colorObj.textColor;
          card.style.setProperty("--card-index", m);
          card.dataset.formattedColor = formatted;
          card.classList.remove("card-initial-appear", "card-animate-in");
          card.style.animation = "none";

          if (isColumnDisabled) {
            card.setAttribute("disabled", "true");
            card.setAttribute("aria-disabled", "true");
            card.title = "Esta paleta está desactivada para tonos neutros.";
          } else {
            card.removeAttribute("disabled");
            card.removeAttribute("aria-disabled");
            card.title = "";
          }

          const valEl = card.querySelector(".color-value");
          if (valEl) valEl.textContent = formatted;
          const hintEl = card.querySelector(".copy-hint");
          if (hintEl) hintEl.textContent = isColumnDisabled ? "Inactiva" : "Copiar";

          const wcag = getWcagContrast(colorObj.r, colorObj.g, colorObj.b, colorObj.textColor);
          let wcagEl = card.querySelector(".card-wcag-badge");
          if (!wcagEl) {
            wcagEl = document.createElement("span");
            wcagEl.className = "card-wcag-badge";
            card.appendChild(wcagEl);
          }
          wcagEl.textContent = wcag.level;
          wcagEl.title = `Ratio WCAG: ${wcag.ratio}:1 (${wcag.level})`;
        } else {
          // Newly added variation (e.g. clicked +)
          // ONLY this card gets the entrance animation!
          const card = createColorCard(colorObj, isColumnDisabled, m, variationChange === "add" ? "add" : null);
          cardsContainer.appendChild(card);
        }
      });

      // If variations decreased (clicked -), remove excess cards from bottom
      while (cardsContainer.children.length > newCount) {
        cardsContainer.lastElementChild.remove();
      }
    });
  }

  container.dataset.mobileActive = state.mobileSelectedHarmony;

  state.isInitialRender = false;
}

/**
 * Updates visible single harmony column on smartphone screens.
 */
export function updateMobileHarmonyVisibility() {
  const container = document.getElementById("harmoniesGrid");
  if (!container) return;
  container.dataset.mobileActive = state.mobileSelectedHarmony;
  const cols = container.querySelectorAll(".harmony-column");
  cols.forEach((col) => {
    col.classList.toggle("is-mobile-visible", col.dataset.harmonyKey === state.mobileSelectedHarmony);
  });
}

/**
 * Renders the harmonic text colors card displaying the lightest and darkest tones
 * of the currently chosen harmony palette for accessible typography.
 *
 * @param {Object} [harmonyData] Pre-calculated harmony data from generateAllHarmonies.
 */
export function renderTextColorsCard(harmonyData = null) {
  const card = document.getElementById("paletteTextColorsCard");
  if (!card) return;

  const data = harmonyData || generateAllHarmonies(state.currentColor, state.variations, "family");
  const activeKey = state.activeHarmony || state.mobileSelectedHarmony || "monochromatic";
  const harmonyItem = data.harmonies[activeKey] || data.harmonies.monochromatic;
  if (!harmonyItem || !harmonyItem.colors || harmonyItem.colors.length === 0) return;

  const colors = harmonyItem.colors;

  // Find darkest (lowest luminance) and lightest (highest luminance)
  let darkest = colors[0];
  let lightest = colors[0];

  colors.forEach((c) => {
    if (c.luminance < darkest.luminance) darkest = c;
    if (c.luminance > lightest.luminance) lightest = c;
  });

  // Sync harmony select dropdown if present
  const harmonySelect = document.getElementById("textColorHarmonySelect");
  if (harmonySelect && document.activeElement !== harmonySelect) {
    harmonySelect.value = activeKey;
  }

  // Calculate contrast ratio directly between the palette's own lightest and darkest tones
  const paletteRatio = (lightest.luminance + 0.05) / (darkest.luminance + 0.05);
  const paletteLevel = paletteRatio >= 7 ? "AAA" : (paletteRatio >= 4.5 ? "AA" : "AA+");
  const isPass = paletteRatio >= 4.5;
  const ratioBadgeText = `${paletteRatio.toFixed(1)}:1 ${paletteLevel}`;
  const ratioBadgeClass = `palette-text-ratio-badge ${isPass ? "is-wcag-pass" : "is-wcag-warn"}`;

  // 1. Dark Text (for light backgrounds) — Fondo claro de la paleta con texto en el tono más oscuro de la paleta
  const darkFormatted = formatColorValue(darkest, state.colorSystem);
  const darkValueEl = document.getElementById("darkTextColorValue");
  const darkDotEl = document.getElementById("darkTextDot");
  const darkHeadingEl = document.getElementById("darkTextHeading");
  const darkBodyEl = document.getElementById("darkTextBody");
  const darkBadgeEl = document.getElementById("darkTextWcagBadge");
  const darkRatioLabel = document.getElementById("darkTextRatioLabel");
  const darkCopyBtn = document.getElementById("copyDarkTextBtn");
  const darkPreviewSurface = document.getElementById("darkTextPreviewSurface");

  if (darkValueEl) darkValueEl.textContent = darkFormatted;
  if (darkDotEl) darkDotEl.style.backgroundColor = darkest.hex;
  if (darkCopyBtn) darkCopyBtn.dataset.color = darkFormatted;

  if (darkPreviewSurface) {
    darkPreviewSurface.style.backgroundColor = lightest.hex;
    darkPreviewSurface.style.borderColor = "rgba(0, 0, 0, 0.14)";
  }
  if (darkHeadingEl) darkHeadingEl.style.color = darkest.hex;
  if (darkBodyEl) {
    darkBodyEl.style.color = darkest.hex;
    darkBodyEl.style.opacity = "0.92";
  }
  if (darkBadgeEl) {
    darkBadgeEl.textContent = ratioBadgeText;
    darkBadgeEl.className = ratioBadgeClass;
  }
  if (darkRatioLabel) {
    darkRatioLabel.style.color = darkest.hex;
    darkRatioLabel.style.opacity = "0.75";
  }

  // 2. Light Text (for dark backgrounds) — Fondo oscuro de la paleta con texto en el tono más claro de la paleta
  const lightFormatted = formatColorValue(lightest, state.colorSystem);
  const lightValueEl = document.getElementById("lightTextColorValue");
  const lightDotEl = document.getElementById("lightTextDot");
  const lightHeadingEl = document.getElementById("lightTextHeading");
  const lightBodyEl = document.getElementById("lightTextBody");
  const lightBadgeEl = document.getElementById("lightTextWcagBadge");
  const lightRatioLabel = document.getElementById("lightTextRatioLabel");
  const lightCopyBtn = document.getElementById("copyLightTextBtn");
  const lightPreviewSurface = document.getElementById("lightTextPreviewSurface");

  if (lightValueEl) lightValueEl.textContent = lightFormatted;
  if (lightDotEl) lightDotEl.style.backgroundColor = lightest.hex;
  if (lightCopyBtn) lightCopyBtn.dataset.color = lightFormatted;

  if (lightPreviewSurface) {
    lightPreviewSurface.style.backgroundColor = darkest.hex;
    lightPreviewSurface.style.borderColor = "rgba(255, 255, 255, 0.14)";
  }
  if (lightHeadingEl) lightHeadingEl.style.color = lightest.hex;
  if (lightBodyEl) {
    lightBodyEl.style.color = lightest.hex;
    lightBodyEl.style.opacity = "0.92";
  }
  if (lightBadgeEl) {
    lightBadgeEl.textContent = ratioBadgeText;
    lightBadgeEl.className = ratioBadgeClass;
  }
  if (lightRatioLabel) {
    lightRatioLabel.style.color = lightest.hex;
    lightRatioLabel.style.opacity = "0.75";
  }
}

/**
 * Updates current seed color and triggers re-render.
 *
 * @param {string} hex HEX color code.
 * @param {boolean} syncPicker Whether to update the custom picker handles.
 */
export function setSeedColor(hex, syncPicker = true) {
  const upper = normalizeHex6(hex);
  if (!upper) {
    return;
  }

  state.currentColor = upper;

  if (state.activeSlot === "default") {
    state.defaultColor = upper;
  } else if (typeof state.activeSlot === "number" && state.userPalettes[state.activeSlot]) {
    state.userPalettes[state.activeSlot].hex = upper;
    saveUserPalettesToStorage();
  }

  if (syncPicker) {
    syncPickerFromColor(state.currentColor);
  }

  // Update active swatch live without tearing down popover
  const activeCircle = document.querySelector(".hero-circle-active");
  if (activeCircle) {
    activeCircle.style.backgroundColor = upper;
    activeCircle.dataset.hex = upper;
    applySwatchShadow(activeCircle, upper, true);
    const labelBtn = activeCircle.parentElement ? activeCircle.parentElement.querySelector(".hero-seed-hex-btn") : null;
    if (labelBtn) {
      labelBtn.textContent = upper;
    }
  }

  renderHarmonies({ skipHeroRebuild: !!activeCircle });
}

/**
 * Modifies variation count between 6 and 15, persisting preference in localStorage.
 *
 * @param {number} delta Step change (+1 or -1).
 */
export function changeVariations(delta) {
  const current = state.variations;
  const next = Math.max(6, Math.min(15, current + delta));
  if (next !== current) {
    state.variations = next;
    try {
      localStorage.setItem("coloristia_variations", String(next));
    } catch (_) {}

    const countDisplay = document.getElementById("variationCountDisplay");
    if (countDisplay) {
      countDisplay.textContent = next;
    }
    renderHarmonies({ variationChange: delta > 0 ? "add" : "remove" });
  }
}

/**
 * Generates a vibrant random hex color code.
 *
 * @returns {string}
 */
export function getRandomVibrantHex() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(65 + Math.random() * 30);
  const l = Math.floor(40 + Math.random() * 25);
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Generates a vibrant random seed color for the default color without corrupting user palettes.
 */
export function generateRandomColor() {
  const hex = getRandomVibrantHex();
  state.activeSlot = "default";
  state.defaultColor = hex;
  state.currentColor = hex;
  syncPickerFromColor(hex);
  renderHarmonies();
}

/**
 * Changes active color system and updates palette cards in-place.
 *
 * @param {string} system 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
 */
export async function changeColorSystem(system) {
  state.colorSystem = system.toLowerCase();
  renderHarmonies();

  // If user is authenticated, persist preferred color system in SQLite
  if (state.isLoggedIn) {
    try {
      const formData = new FormData();
      formData.append("color_system", state.colorSystem);
      formData.append("_token", getCsrfToken());

      await fetch("/usuario/sistema-color", {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": getCsrfToken()
        },
        body: formData
      });
    } catch (e) {
      console.warn("Unable to persist color system preference:", e);
    }
  }
}

/**
 * Saves current palette project into the SQLite database.
 */
export async function saveCurrentProject() {
  if (!state.isLoggedIn) {
    openModal("loginModal");
    showToast("Inicia sesión para guardar tus proyectos.", "info");
    return;
  }

  const nameInput = document.getElementById("projectNameInput");
  const projectName = nameInput ? nameInput.value.trim() : "";
  const finalName = projectName || `Paleta Base ${state.currentColor}`;

  try {
    const formData = new FormData();
    formData.append("project_name", finalName);
    formData.append("hex_color", state.currentColor);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/proyectos/guardar", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": getCsrfToken()
      },
      body: formData
    });

    const res = await response.json();
    if (res.status === "success") {
      showToast(res.message, "success");
      if (res.project) {
        state.projects.unshift(res.project);
        if (state.userPalettes.length < MAX_USER_PALETTES) {
          const alreadyIn = state.userPalettes.some((p) => Number(p.id) === Number(res.project.id));
          if (!alreadyIn) {
            state.userPalettes.push({
              id: res.project.id,
              name: res.project.project_name,
              hex: res.project.hex_color
            });
            state.activeSlot = state.userPalettes.length - 1;
            saveUserPalettesToStorage();
            renderHeroSeed();
          }
        }
        renderProjectsList();
      }
    } else {
      showToast(res.message || "Error al guardar el proyecto.", "error");
    }
  } catch (error) {
    showToast("Error de conexión al guardar el proyecto.", "error");
  }
}

/**
 * Renames a saved project in the database.
 *
 * @param {number|string} projectId
 * @param {string} newName
 */
export async function renameProject(projectId, newName) {
  try {
    const formData = new FormData();
    formData.append("id", projectId);
    formData.append("project_name", newName);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/proyectos/renombrar", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": getCsrfToken()
      },
      body: formData
    });

    const res = await response.json();
    if (res.status === "success") {
      const target = state.projects.find((p) => Number(p.id) === Number(projectId));
      if (target) {
        target.project_name = newName;
      }
      const inUserPal = state.userPalettes.find((p) => Number(p.id) === Number(projectId));
      if (inUserPal) {
        inUserPal.name = newName;
        saveUserPalettesToStorage();
        renderHeroSeed();
      }
      renderProjectsList();
      showToast(res.message, "success");
    } else {
      showToast(res.message || "Error al renombrar el proyecto.", "error");
    }
  } catch (err) {
    showToast("Error de conexión al renombrar.", "error");
  }
}

/**
 * Deletes a saved project from the database immediately without browser alert/confirm.
 *
 * @param {number|string} projectId
 */
export async function deleteProject(projectId) {
  try {
    const formData = new FormData();
    formData.append("id", projectId);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/proyectos/eliminar", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": getCsrfToken()
      },
      body: formData
    });

    const res = await response.json();
    if (res.status === "success") {
      state.projects = state.projects.filter((p) => Number(p.id) !== Number(projectId));

      // Remove from active user palettes in work panel memory
      const removedIdx = state.userPalettes.findIndex((p) => Number(p.id) === Number(projectId));
      if (removedIdx !== -1) {
        state.userPalettes.splice(removedIdx, 1);
        saveUserPalettesToStorage();

        if (state.activeSlot === removedIdx) {
          if (state.userPalettes.length > 0) {
            state.activeSlot = 0;
            state.currentColor = state.userPalettes[0].hex;
          } else {
            state.activeSlot = "default";
            state.currentColor = state.defaultColor;
          }
          syncPickerFromColor(state.currentColor);
        } else if (typeof state.activeSlot === "number" && state.activeSlot > removedIdx) {
          state.activeSlot -= 1;
        }
        renderHarmonies();
      } else {
        renderHeroSeed();
      }

      renderProjectsList();
      showToast(res.message, "success");
    } else {
      showToast(res.message || "Error al eliminar el proyecto.", "error");
    }
  } catch (err) {
    showToast("Error de conexión al eliminar.", "error");
  }
}

/**
 * Fetches saved user projects from /proyectos/listar asynchronously on demand.
 *
 * @returns {Promise<void>}
 */
export async function loadUserProjects() {
  if (!state.isLoggedIn) {
    state.projects = [];
    return;
  }

  state.isLoadingProjects = true;
  renderProjectsList();

  try {
    const res = await fetch("/proyectos/listar", {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success" && Array.isArray(data.projects)) {
        state.projects = data.projects;

        // Ensure userPalettes in memory only retain existing saved projects or active base
        if (state.userPalettes.length > 0 && state.projects.length > 0) {
          state.userPalettes = state.userPalettes.filter((p) =>
            state.projects.some((proj) => Number(proj.id) === Number(p.id) || (proj.hex_color && p.hex && proj.hex_color.toUpperCase() === p.hex.toUpperCase()))
          );
          saveUserPalettesToStorage();
        }
      }
    }
  } catch (err) {
    console.warn("No se pudieron cargar los proyectos:", err);
  } finally {
    state.isLoadingProjects = false;
    renderProjectsList();
    renderHeroSeed();
  }
}

/**
 * Renders the saved projects list inside the drawer modal.
 */
export function renderProjectsList() {
  const container = document.getElementById("projectsListContainer");
  if (!container) return;

  if (state.isLoadingProjects) {
    container.innerHTML = `
      <div class="empty-projects text-center py30 flex-column gap10">
        <p class="text-secondary text-base">Cargando tus paletas guardadas...</p>
      </div>
    `;
    return;
  }

  if (!state.projects || state.projects.length === 0) {
    container.innerHTML = `
      <div class="empty-projects text-center py30 flex-column gap10">
        <p class="text-secondary text-base">Aún no has guardado ninguna paleta.</p>
        <p class="text-inactive text-sm">Escribe el nombre de tu proyecto arriba y haz clic en "Guardar".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  state.projects.forEach((proj) => {
    const isLoaded = state.userPalettes.some((p) => Number(p.id) === Number(proj.id));
    const item = document.createElement("div");
    item.className = `project-item flex-row items-center justify-between gap16 p12 br8 ${isLoaded ? "project-item-active" : ""}`;

    item.innerHTML = `
      <div class="flex-row items-center gap14" style="flex: 1; min-width: 0;">
        <div class="project-swatch-box br8" style="background-color: ${proj.hex_color}; width: 44px; height: 44px; flex-shrink: 0; box-shadow: 0 2px 8px ${proj.hex_color}66;"></div>
        <div class="flex-column" style="min-width: 0;">
          <div class="flex-row items-center gap8">
            <span class="project-name-wrap">
              <span class="project-name bold600 text-white font-truncate">${escapeHtml(proj.project_name)}</span>
            </span>
            <button type="button" class="btn-icon-rename" title="Renombrar paleta" data-id="${proj.id}" aria-label="Renombrar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            ${isLoaded ? '<span class="badge-active font-mono text-xs" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 500;">En panel</span>' : ''}
          </div>
        </div>
      </div>
      <div class="flex-row items-center gap10 flex-shrink-0">
        <button type="button" class="btn-load-palette" data-id="${proj.id}">
          ${isLoaded ? "Activa" : "Cargar"}
        </button>
        <button type="button" class="btn-delete-palette" data-id="${proj.id}" title="Eliminar paleta" aria-label="Eliminar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Click "Cargar"
    item.querySelector(".btn-load-palette").addEventListener("click", () => {
      const existingIdx = state.userPalettes.findIndex((p) => Number(p.id) === Number(proj.id));
      if (existingIdx !== -1) {
        state.activeSlot = existingIdx;
        state.currentColor = state.userPalettes[existingIdx].hex;
        syncPickerFromColor(state.currentColor);
        renderHarmonies();
        renderProjectsList();
        closeModal("projectsModal");
        showToast(`Paleta activa: ${proj.project_name}`);
        return;
      }

      if (state.userPalettes.length >= MAX_USER_PALETTES) {
        showToast("Límite alcanzado: solo puedes tener hasta 5 paletas activas en el panel (+ color base).", "warning");
        return;
      }

      const loadedPal = {
        id: proj.id,
        name: proj.project_name,
        hex: normalizeHex6(proj.hex_color) || proj.hex_color
      };

      state.userPalettes.push(loadedPal);
      state.activeSlot = state.userPalettes.length - 1;
      saveUserPalettesToStorage();

      state.currentColor = loadedPal.hex;
      syncPickerFromColor(state.currentColor);

      closeModal("projectsModal");
      renderHarmonies();
      renderProjectsList();
      showToast(`Paleta "${proj.project_name}" cargada al panel (${state.userPalettes.length}/5).`, "success");
    });

    // Click rename button -> inline edit without window.prompt or alert
    const renameBtn = item.querySelector(".btn-icon-rename");
    if (renameBtn) {
      renameBtn.addEventListener("click", () => {
        const nameContainer = item.querySelector(".project-name-wrap");
        if (!nameContainer || nameContainer.querySelector(".rename-inline-input")) return;

        const originalName = proj.project_name;
        nameContainer.innerHTML = `
          <input type="text" class="rename-inline-input" value="${escapeHtml(originalName)}" maxlength="40" />
        `;
        const input = nameContainer.querySelector(".rename-inline-input");
        input.focus();
        input.select();

        let isSaved = false;
        const commitRename = async () => {
          if (isSaved) return;
          isSaved = true;
          const newVal = input.value.trim();
          if (newVal && newVal !== originalName) {
            await renameProject(proj.id, newVal);
          } else {
            renderProjectsList();
          }
        };

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitRename();
          } else if (e.key === "Escape") {
            e.preventDefault();
            isSaved = true;
            renderProjectsList();
          }
        });

        input.addEventListener("blur", () => {
          commitRename();
        });
      });
    }

    // Click delete trash icon
    item.querySelector(".btn-delete-palette").addEventListener("click", () => {
      deleteProject(proj.id);
    });

    container.appendChild(item);
  });
}

/**
 * Abre el modal de exportación para una armonía específica o para todas.
 *
 * @param {string} [harmonyKey='all'] 'all' para exportar todas o ID de la armonía (ej. 'monochromatic').
 */
export function openExportModalForHarmony(harmonyKey = "all") {
  state.exportTarget = harmonyKey;
  const scopeSelect = document.getElementById("exportScopeSelect");
  if (scopeSelect) {
    scopeSelect.value = harmonyKey;
  }
  openModal("exportModal");
  renderExportCode();
}

/**
 * Genera y muestra el código de exportación de la paleta en CSS, Tailwind o JSON.
 * Respeta el formato seleccionado, el alcance (todas las paletas o una específica),
 * el parámetro de variaciones y el sistema de color (HEX, RGB, HSL, HSV, CMYK).
 *
 * @param {string|null} [format] Formato a renderizar: 'css' | 'tailwind' | 'json'.
 * @param {string|null} [target] Alcance a exportar: 'all' | '<harmonyKey>'.
 */
export function renderExportCode(format = null, target = null) {
  if (format) {
    state.exportFormat = format;
  }
  if (target !== null && target !== undefined) {
    state.exportTarget = target;
  }
  const currentFormat = state.exportFormat || "css";
  const currentTarget = state.exportTarget || "all";

  // Actualizar clases activas en los botones de pestañas
  document.querySelectorAll(".export-tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.exportFormat === currentFormat);
  });

  // Sincronizar selector de alcance en el modal
  const scopeSelect = document.getElementById("exportScopeSelect");
  if (scopeSelect && scopeSelect.value !== currentTarget) {
    scopeSelect.value = currentTarget;
  }

  const labelEl = document.getElementById("exportFormatLabel");
  const previewEl = document.getElementById("exportCodePreview");
  const modalTitleEl = document.getElementById("exportModalTitle");
  if (!previewEl) return;

  const data = generateAllHarmonies(state.currentColor, state.variations, "family");
  const seedColorObj = {
    r: data.seed.rgb.r,
    g: data.seed.rgb.g,
    b: data.seed.rgb.b,
    h: data.seed.hsl.h,
    s: data.seed.hsl.s,
    l: data.seed.hsl.l,
    hex: data.seed.hex
  };
  const baseFormatted = formatColorValue(seedColorObj, state.colorSystem);
  const isAll = currentTarget === "all";

  // Determinar armonía objetivo si es individual
  const singleHarmony = !isAll ? (data.harmonies[currentTarget] || data.harmonies.monochromatic) : null;
  const harmonyDisplayName = isAll ? "Todas las Armonías (12)" : (singleHarmony?.rule?.name || "Armonía");

  // Actualizar título del modal
  if (modalTitleEl) {
    modalTitleEl.textContent = isAll
      ? "Exportar Todas las Armonías"
      : `Exportar Armonía: ${harmonyDisplayName}`;
  }

  const sysUpper = state.colorSystem.toUpperCase();
  let codeOutput = "";

  if (currentFormat === "css") {
    if (labelEl) {
      labelEl.textContent = `Formato: CSS (:root) | ${harmonyDisplayName} | Sistema: ${sysUpper} | Variaciones: ${state.variations}`;
    }

    if (isAll) {
      const lines = [
        "/* ==================================================",
        ` * Paletas generadas en Coloristia (Todas las armonías)`,
        ` * Color Base: ${baseFormatted} (${data.seed.hex})`,
        ` * Variaciones: ${state.variations} | Sistema: ${sysUpper}`,
        " * ================================================== */",
        ":root {",
        `  --color-base: ${baseFormatted};`,
        ""
      ];

      for (const [key, item] of Object.entries(data.harmonies)) {
        lines.push(`  /* ${item.rule.name} */`);
        item.colors.forEach((c, i) => {
          const val = formatColorValue(c, state.colorSystem);
          lines.push(`  --${key}-${i + 1}: ${val};`);
        });
        lines.push("");
      }

      lines.push("}");
      codeOutput = lines.join("\n");
    } else {
      const lines = [
        "/* ==================================================",
        ` * Paleta generada en Coloristia`,
        ` * Armonía: ${singleHarmony.rule.name}`,
        ` * Color Base: ${baseFormatted} (${data.seed.hex})`,
        ` * Variaciones: ${state.variations} | Sistema: ${sysUpper}`,
        " * ================================================== */",
        ":root {",
        `  --color-base: ${baseFormatted};`,
        ""
      ];

      lines.push(`  /* ${singleHarmony.rule.name} (${singleHarmony.colors.length} variaciones) */`);
      singleHarmony.colors.forEach((c, i) => {
        const val = formatColorValue(c, state.colorSystem);
        lines.push(`  --color-step-${i + 1}: ${val};`);
      });
      lines.push("}");
      codeOutput = lines.join("\n");
    }
  } else if (currentFormat === "tailwind") {
    if (labelEl) {
      labelEl.textContent = `Formato: Tailwind Config | ${harmonyDisplayName} | Sistema: ${sysUpper} | Variaciones: ${state.variations}`;
    }

    const standardShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const getShade = (i, total) => {
      if (total <= standardShades.length) {
        return standardShades[i];
      }
      return (i + 1) * 50;
    };

    if (isAll) {
      const harmonyBlocks = [];
      for (const [key, item] of Object.entries(data.harmonies)) {
        const shadeLines = [];
        item.colors.forEach((c, i) => {
          const val = formatColorValue(c, state.colorSystem);
          shadeLines.push(`          ${getShade(i, item.colors.length)}: '${val}',`);
        });

        harmonyBlocks.push([
          `        ${key}: {`,
          `          DEFAULT: '${baseFormatted}',`,
          ...shadeLines,
          "        },"
        ].join("\n"));
      }

      codeOutput = [
        "// tailwind.config.js",
        `// Generado en Coloristia (Todas las armonías, Base: ${baseFormatted})`,
        "module.exports = {",
        "  theme: {",
        "    extend: {",
        "      colors: {",
        `        base: '${baseFormatted}',`,
        harmonyBlocks.join("\n"),
        "      },",
        "    },",
        "  },",
        "};"
      ].join("\n");
    } else {
      const shadeLines = [];
      singleHarmony.colors.forEach((c, i) => {
        const val = formatColorValue(c, state.colorSystem);
        shadeLines.push(`          ${getShade(i, singleHarmony.colors.length)}: '${val}',`);
      });

      codeOutput = [
        "// tailwind.config.js",
        `// Generado en Coloristia (Armonía: ${singleHarmony.rule.name}, Base: ${baseFormatted})`,
        "module.exports = {",
        "  theme: {",
        "    extend: {",
        "      colors: {",
        "        brand: {",
        `          DEFAULT: '${baseFormatted}',`,
        ...shadeLines,
        "        },",
        "      },",
        "    },",
        "  },",
        "};"
      ].join("\n");
    }
  } else if (currentFormat === "json") {
    if (labelEl) {
      labelEl.textContent = `Formato: JSON Tokens | ${harmonyDisplayName} | Sistema: ${sysUpper} | Variaciones: ${state.variations}`;
    }

    if (isAll) {
      const jsonAll = {
        generator: "Coloristia",
        paletteName: `Coloristia - Todas las Armonías (${baseFormatted})`,
        baseColor: baseFormatted,
        baseHex: data.seed.hex,
        colorSystem: state.colorSystem,
        variations: state.variations,
        totalHarmonies: Object.keys(data.harmonies).length,
        harmonies: {}
      };

      for (const [key, item] of Object.entries(data.harmonies)) {
        let darkest = item.colors[0];
        let lightest = item.colors[0];
        item.colors.forEach((c) => {
          if (c.luminance < darkest.luminance) darkest = c;
          if (c.luminance > lightest.luminance) lightest = c;
        });
        const ratio = (lightest.luminance + 0.05) / (darkest.luminance + 0.05);
        const level = ratio >= 7 ? "AAA" : (ratio >= 4.5 ? "AA" : "AA+");

        jsonAll.harmonies[key] = {
          id: key,
          name: item.rule.name,
          description: item.rule.description,
          textColors: {
            darkText: {
              value: formatColorValue(darkest, state.colorSystem),
              hex: darkest.hex,
              role: "Texto oscuro para fondos claros de la paleta",
              wcagRatio: Number(ratio.toFixed(1)),
              wcagLevel: level
            },
            lightText: {
              value: formatColorValue(lightest, state.colorSystem),
              hex: lightest.hex,
              role: "Texto claro para fondos oscuros de la paleta",
              wcagRatio: Number(ratio.toFixed(1)),
              wcagLevel: level
            }
          },
          colors: item.colors.map((c, i) => ({
            step: i + 1,
            value: formatColorValue(c, state.colorSystem),
            hex: c.hex,
            rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
            hsl: `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`,
            textColor: c.textColor,
            contrast: getWcagContrast(c.r, c.g, c.b, c.textColor)
          }))
        };
      }

      codeOutput = JSON.stringify(jsonAll, null, 2);
    } else {
      let darkest = singleHarmony.colors[0];
      let lightest = singleHarmony.colors[0];
      singleHarmony.colors.forEach((c) => {
        if (c.luminance < darkest.luminance) darkest = c;
        if (c.luminance > lightest.luminance) lightest = c;
      });
      const ratio = (lightest.luminance + 0.05) / (darkest.luminance + 0.05);
      const level = ratio >= 7 ? "AAA" : (ratio >= 4.5 ? "AA" : "AA+");

      const jsonSingle = {
        generator: "Coloristia",
        paletteName: `Coloristia - ${singleHarmony.rule.name} (${baseFormatted})`,
        baseColor: baseFormatted,
        baseHex: data.seed.hex,
        colorSystem: state.colorSystem,
        variations: state.variations,
        harmony: {
          id: currentTarget,
          name: singleHarmony.rule.name,
          description: singleHarmony.rule.description
        },
        textColors: {
          darkText: {
            value: formatColorValue(darkest, state.colorSystem),
            hex: darkest.hex,
            role: "Texto oscuro para fondos claros de la paleta",
            wcagRatio: Number(ratio.toFixed(1)),
            wcagLevel: level
          },
          lightText: {
            value: formatColorValue(lightest, state.colorSystem),
            hex: lightest.hex,
            role: "Texto claro para fondos oscuros de la paleta",
            wcagRatio: Number(ratio.toFixed(1)),
            wcagLevel: level
          }
        },
        colors: singleHarmony.colors.map((c, i) => ({
          step: i + 1,
          value: formatColorValue(c, state.colorSystem),
          hex: c.hex,
          rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
          hsl: `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`,
          textColor: c.textColor,
          contrast: getWcagContrast(c.r, c.g, c.b, c.textColor)
        }))
      };

      codeOutput = JSON.stringify(jsonSingle, null, 2);
    }
  }

  previewEl.textContent = codeOutput;
}

/**
 * Opens a modal dialog by its element ID.
 *
 * @param {string} modalId
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("is-active");
    document.body.classList.add("modal-open");
  }
}

/**
 * Closes an active modal dialog by its element ID.
 *
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("is-active");
    if (!document.querySelector(".modal.is-active")) {
      document.body.classList.remove("modal-open");
    }
  }
}

// =========================================================================
// SECTION 2.1: IN-APP CUSTOM COLOR PICKER (HSV: TONO, SATURACIÓN, BRILLO)
// =========================================================================

const pickerState = {
  h: 0,
  s: 1,
  v: 1,
  isOpen: false,
  activeTrigger: null
};

/**
 * Synchronizes the color picker UI handles, dynamic track gradients, preview circle, and hex input.
 */
export function syncPickerUI() {
  const hueTrack = document.getElementById("customPickerHueTrack");
  const hueHandle = document.getElementById("customPickerHueHandle");
  const satTrack = document.getElementById("customPickerSatTrack");
  const satHandle = document.getElementById("customPickerSatHandle");
  const valTrack = document.getElementById("customPickerValTrack");
  const valHandle = document.getElementById("customPickerValHandle");
  const previewCircle = document.getElementById("customPickerPreviewCircle");
  const hexInput = document.getElementById("customPickerHexInput");

  if (!hueTrack || !hueHandle || !satTrack || !satHandle || !valTrack || !valHandle) return;

  // 1. Tono (Hue) handle position & ARIA
  const huePercent = (pickerState.h / 360) * 100;
  hueHandle.style.left = `${huePercent}%`;
  hueTrack.setAttribute("aria-valuenow", Math.round(pickerState.h));

  // 2. Saturación handle position, dynamic gradient & ARIA
  const satPercent = pickerState.s * 100;
  satHandle.style.left = `${satPercent}%`;
  satTrack.setAttribute("aria-valuenow", Math.round(satPercent));

  const rgbSat0 = hsvNormToRgb(pickerState.h, 0, pickerState.v);
  const rgbSat1 = hsvNormToRgb(pickerState.h, 1, pickerState.v);
  satTrack.style.background = `linear-gradient(to right, rgb(${rgbSat0.r}, ${rgbSat0.g}, ${rgbSat0.b}), rgb(${rgbSat1.r}, ${rgbSat1.g}, ${rgbSat1.b}))`;

  // 3. Brillo (Value) handle position, dynamic gradient & ARIA
  const valPercent = pickerState.v * 100;
  valHandle.style.left = `${valPercent}%`;
  valTrack.setAttribute("aria-valuenow", Math.round(valPercent));

  const rgbVal1 = hsvNormToRgb(pickerState.h, pickerState.s, 1);
  valTrack.style.background = `linear-gradient(to right, #000000, rgb(${rgbVal1.r}, ${rgbVal1.g}, ${rgbVal1.b}))`;

  // 4. Color preview circle
  if (previewCircle) {
    previewCircle.style.backgroundColor = state.currentColor;
  }

  // 5. Hex badge input
  if (hexInput && document.activeElement !== hexInput) {
    hexInput.value = state.currentColor;
  }
}

/**
 * Synchronizes the picker HSV coordinates from a given HEX string.
 *
 * @param {string} hex
 */
export function syncPickerFromColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const hsv = rgbToHsvNorm(rgb.r, rgb.g, rgb.b);
  pickerState.h = hsv.h;
  pickerState.s = hsv.s;
  pickerState.v = hsv.v;
  syncPickerUI();
}

/**
 * Opens the in-app custom color picker anchored to a trigger element without blocking.
 *
 * @param {HTMLElement} triggerEl
 */
export function openColorPicker(triggerEl) {
  const popover = document.getElementById("coloristiaPickerPopover");
  if (!popover) return;

  pickerState.activeTrigger = triggerEl;
  pickerState.isOpen = true;

  if (triggerEl.id === "heroColorSwatch" || triggerEl.id === "heroColorLabel" || triggerEl.id === "heroLoadedSwatch" || triggerEl.id === "heroLoadedLabel" || triggerEl.closest(".hero-seed-item")) {
    const heroContainer = document.querySelector(".hero-seed-container");
    if (heroContainer) {
      popover.style.top = "100%";
      popover.style.left = "50%";
      popover.style.right = "auto";
      popover.style.transform = "translateX(-50%) translateY(14px)";
      heroContainer.appendChild(popover);
    }
  } else {
    const parent = triggerEl.parentElement || triggerEl;
    parent.style.position = "relative";
    popover.style.top = "calc(100% + 10px)";
    const rect = triggerEl.getBoundingClientRect();
    if (rect.left + 280 > window.innerWidth) {
      popover.style.left = "auto";
      popover.style.right = "0";
      popover.style.transform = "none";
    } else {
      popover.style.left = "0";
      popover.style.right = "auto";
      popover.style.transform = "none";
    }
    parent.appendChild(popover);
  }

  popover.style.display = "flex";
  syncPickerFromColor(state.currentColor);
}

/**
 * Closes the in-app custom color picker.
 */
export function closeColorPicker() {
  const popover = document.getElementById("coloristiaPickerPopover");
  if (popover) {
    popover.style.display = "none";
  }
  pickerState.isOpen = false;
  pickerState.activeTrigger = null;
}

/**
 * Toggles the color picker visibility for a trigger element.
 *
 * @param {HTMLElement} triggerEl
 */
export function toggleColorPicker(triggerEl) {
  if (pickerState.isOpen && pickerState.activeTrigger === triggerEl) {
    closeColorPicker();
  } else {
    openColorPicker(triggerEl);
  }
}

/**
 * Initializes touch and mouse drag events and listeners for the custom color picker sliders.
 */
function initCustomPickerEvents() {
  const hueTrack = document.getElementById("customPickerHueTrack");
  const satTrack = document.getElementById("customPickerSatTrack");
  const valTrack = document.getElementById("customPickerValTrack");
  const hexInput = document.getElementById("customPickerHexInput");
  const acceptBtn = document.getElementById("customPickerAcceptBtn");

  if (!hueTrack || !satTrack || !valTrack) return;

  const updateSeedFromPicker = () => {
    const rgb = hsvNormToRgb(pickerState.h, pickerState.s, pickerState.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSeedColor(hex, false);
    syncPickerUI();
  };

  /**
   * Sets up drag and tap handling on a slider track with touch and pointer support.
   *
   * @param {HTMLElement} trackElem
   * @param {function(number): void} onRatioChange
   */
  const setupSliderInteraction = (trackElem, onRatioChange) => {
    let isDragging = false;
    let activePointerId = null;

    const calculateRatio = (clientX) => {
      const rect = trackElem.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return clampedX / rect.width;
    };

    const handleStart = (clientX, pointerId) => {
      isDragging = true;
      activePointerId = pointerId !== undefined ? pointerId : null;
      if (pointerId !== undefined && trackElem.setPointerCapture) {
        try { trackElem.setPointerCapture(pointerId); } catch (_) {}
      }
      onRatioChange(calculateRatio(clientX));
    };

    const handleMove = (clientX, pointerId) => {
      if (!isDragging) return;
      if (activePointerId !== null && pointerId !== undefined && pointerId !== activePointerId) return;
      onRatioChange(calculateRatio(clientX));
    };

    const handleEnd = (pointerId) => {
      if (!isDragging) return;
      isDragging = false;
      if (activePointerId !== null && trackElem.releasePointerCapture) {
        try { trackElem.releasePointerCapture(activePointerId); } catch (_) {}
      }
      activePointerId = null;
    };

    // Pointer events for desktop and modern touch devices
    trackElem.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      handleStart(e.clientX, e.pointerId);
      e.preventDefault();
    });

    trackElem.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      handleMove(e.clientX, e.pointerId);
      e.preventDefault();
    });

    const stopPointer = (e) => {
      handleEnd(e.pointerId);
    };
    trackElem.addEventListener("pointerup", stopPointer);
    trackElem.addEventListener("pointercancel", stopPointer);

    // Native touch events fallback for mobile screens
    trackElem.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      handleStart(e.touches[0].clientX);
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    trackElem.addEventListener("touchmove", (e) => {
      if (!isDragging || !e.touches || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX);
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    const stopTouch = () => {
      handleEnd();
    };
    trackElem.addEventListener("touchend", stopTouch);
    trackElem.addEventListener("touchcancel", stopTouch);
  };

  // 1. Tono (Hue: 0° - 360°)
  setupSliderInteraction(hueTrack, (ratio) => {
    pickerState.h = normHue(ratio * 360);
    updateSeedFromPicker();
  });

  // 2. Saturación (Saturation: 0 - 1)
  setupSliderInteraction(satTrack, (ratio) => {
    pickerState.s = Math.max(0, Math.min(1, ratio));
    updateSeedFromPicker();
  });

  // 3. Brillo (Value: 0 - 1)
  setupSliderInteraction(valTrack, (ratio) => {
    pickerState.v = Math.max(0, Math.min(1, ratio));
    updateSeedFromPicker();
  });

  // Keyboard accessibility
  const handleKeyboardStep = (e, getValue, setValue, step, min, max) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    else if (e.key === "PageDown") delta = -step * 5;
    else if (e.key === "PageUp") delta = step * 5;
    else return;

    e.preventDefault();
    const current = getValue();
    const updated = Math.max(min, Math.min(max, current + delta));
    setValue(updated);
    updateSeedFromPicker();
  };

  hueTrack.addEventListener("keydown", (e) => {
    handleKeyboardStep(e, () => pickerState.h, (val) => { pickerState.h = normHue(val); }, 2, 0, 360);
  });
  satTrack.addEventListener("keydown", (e) => {
    handleKeyboardStep(e, () => pickerState.s, (val) => { pickerState.s = val; }, 0.02, 0, 1);
  });
  valTrack.addEventListener("keydown", (e) => {
    handleKeyboardStep(e, () => pickerState.v, (val) => { pickerState.v = val; }, 0.02, 0, 1);
  });

  // Hex input listener
  if (hexInput) {
    hexInput.addEventListener("input", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) val = "#" + val;
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
        setSeedColor(val, false);
        const rgb = hexToRgb(val);
        const hsv = rgbToHsvNorm(rgb.r, rgb.g, rgb.b);
        pickerState.h = hsv.h;
        pickerState.s = hsv.s;
        pickerState.v = hsv.v;
        syncPickerUI();
      }
    });
  }

  // Aceptar button
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      closeColorPicker();
    });
  }

  // Close on outside pointer click
  document.addEventListener("pointerdown", (e) => {
    const popover = document.getElementById("coloristiaPickerPopover");
    if (!popover || popover.style.display === "none") return;
    if (popover.contains(e.target)) return;
    if (e.target.closest(".hero-seed-item") || e.target.closest("#quickColorTrigger")) return;
    closeColorPicker();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeColorPicker();
    }
  });
}

/**
 * Main application bootstrap function.
 */
export function initColoristia() {
  if (window.__coloristiaInitialized) {
    renderHarmonies();
    return;
  }
  window.__coloristiaInitialized = true;

  // Load initial state from DOM container dataset attributes (no inline script needed)
  const wrapperEl = document.getElementById("coloristiaWrapper") || document.querySelector(".coloristia-wrapper");
  if (wrapperEl) {
    state.isLoggedIn = wrapperEl.dataset.loggedIn === "1" || wrapperEl.dataset.loggedIn === "true";
    state.colorSystem = wrapperEl.dataset.colorSystem || "hex";
  }

  // Load variation count preference from localStorage (default 15, between 6 and 15)
  try {
    const savedVars = localStorage.getItem("coloristia_variations");
    if (savedVars) {
      const parsed = parseInt(savedVars, 10);
      if (!isNaN(parsed) && parsed >= 6 && parsed <= 15) {
        state.variations = parsed;
      }
    }
  } catch (_) {}

  const variationCountDisplay = document.getElementById("variationCountDisplay");
  if (variationCountDisplay) {
    variationCountDisplay.textContent = state.variations;
  }

  // Generate a random seed color on every page load / refresh for defaultColor
  const randH = Math.floor(Math.random() * 360);
  const randS = Math.floor(65 + Math.random() * 30);
  const randL = Math.floor(40 + Math.random() * 25);
  const initRgb = hslToRgb(randH, randS, randL);
  const defaultHex = rgbToHex(initRgb.r, initRgb.g, initRgb.b);
  state.defaultColor = defaultHex;
  state.currentColor = defaultHex;

  // Load user palettes from local storage
  loadUserPalettesFromStorage();

  // If user is logged in, fetch saved projects asynchronously on demand/background
  if (state.isLoggedIn) {
    loadUserProjects();
  } else {
    state.projects = [];
    state.userPalettes = [];
    saveUserPalettesToStorage();
  }

  // Initialize in-app custom color picker
  initCustomPickerEvents();

  // Color system dropdown event listener
  const systemSelect = document.getElementById("colorSystemSelect");
  if (systemSelect) {
    systemSelect.value = state.colorSystem;
    systemSelect.addEventListener("change", (e) => {
      changeColorSystem(e.target.value);
    });
  }

  // Variation count stepper event listeners
  const decBtn = document.getElementById("decreaseVariationsBtn");
  const incBtn = document.getElementById("increaseVariationsBtn");
  if (decBtn) {
    decBtn.addEventListener("click", () => changeVariations(-1));
  }
  if (incBtn) {
    incBtn.addEventListener("click", () => changeVariations(1));
  }

  // Quick color trigger
  const quickTrigger = document.getElementById("quickColorTrigger");
  if (quickTrigger) {
    quickTrigger.addEventListener("click", () => toggleColorPicker(quickTrigger));
  }

  // --- Hero Seed Work Panel (Default Color + Up to 5 User Palettes) ---
  const seedsTrack = document.getElementById("heroSeedsTrack");
  if (seedsTrack) {
    seedsTrack.addEventListener("click", (e) => {
      // 1. Dismiss user palette from panel (X)
      const dismissBtn = e.target.closest('[data-action="dismiss-user"]');
      if (dismissBtn) {
        e.stopPropagation();
        const idx = Number(dismissBtn.dataset.index);
        if (idx >= 0 && idx < state.userPalettes.length) {
          closeColorPicker();
          state.userPalettes.splice(idx, 1);
          saveUserPalettesToStorage();
          if (state.activeSlot === idx) {
            if (state.userPalettes.length > 0) {
              state.activeSlot = 0;
              state.currentColor = state.userPalettes[0].hex;
            } else {
              state.activeSlot = "default";
              state.currentColor = state.defaultColor;
            }
            syncPickerFromColor(state.currentColor);
          } else if (typeof state.activeSlot === "number" && state.activeSlot > idx) {
            state.activeSlot -= 1;
          }
          renderHarmonies();
          renderProjectsList();
          showToast("Paleta retirada del panel.", "info");
        }
        return;
      }

      // 2. Activate user palette via button or label
      const activateUserBtn = e.target.closest('[data-action="activate-user"]');
      if (activateUserBtn) {
        e.stopPropagation();
        const idx = Number(activateUserBtn.dataset.index);
        if (idx >= 0 && idx < state.userPalettes.length) {
          const pal = state.userPalettes[idx];
          if (state.activeSlot !== idx) {
            closeColorPicker();
            state.activeSlot = idx;
            state.currentColor = pal.hex;
            syncPickerFromColor(state.currentColor);
            renderHarmonies();
            showToast(`Paleta activa: ${pal.name || pal.hex}`);
          }
        }
        return;
      }

      // 3. Click on user palette circle
      const circleUser = e.target.closest('[data-action="circle-user"]');
      if (circleUser) {
        e.stopPropagation();
        const idx = Number(circleUser.dataset.index);
        if (idx >= 0 && idx < state.userPalettes.length) {
          const pal = state.userPalettes[idx];
          if (state.activeSlot !== idx) {
            closeColorPicker();
            state.activeSlot = idx;
            state.currentColor = pal.hex;
            syncPickerFromColor(state.currentColor);
            renderHarmonies();
            showToast(`Paleta activa: ${pal.name || pal.hex}`);
          } else {
            toggleColorPicker(circleUser);
          }
        }
        return;
      }

      // 4. Activate or click default color
      const activateDefault = e.target.closest('[data-action="activate-default"]');
      if (activateDefault) {
        e.stopPropagation();
        if (state.activeSlot !== "default") {
          closeColorPicker();
          state.activeSlot = "default";
          state.currentColor = state.defaultColor;
          syncPickerFromColor(state.currentColor);
          renderHarmonies();
          showToast(`Color base activo: ${state.defaultColor}`);
        }
        return;
      }

      const circleDefault = e.target.closest('[data-action="circle-default"]');
      if (circleDefault) {
        e.stopPropagation();
        if (state.activeSlot !== "default") {
          closeColorPicker();
          state.activeSlot = "default";
          state.currentColor = state.defaultColor;
          syncPickerFromColor(state.currentColor);
          renderHarmonies();
          showToast(`Color base activo: ${state.defaultColor}`);
        } else {
          toggleColorPicker(circleDefault);
        }
        return;
      }
    });
  }

  // Clear all user palettes button (Borrar colores)
  const clearPinnedBtn = document.getElementById("clearPinnedBtn");
  if (clearPinnedBtn) {
    clearPinnedBtn.addEventListener("click", () => {
      closeColorPicker();
      state.userPalettes = [];
      state.activeSlot = "default";
      saveUserPalettesToStorage();
      state.currentColor = state.defaultColor;
      syncPickerFromColor(state.currentColor);
      renderHarmonies();
      renderProjectsList();
      showToast("Se han borrado las paletas del panel.", "info");
    });
  }

  // Random color button: generates a vibrant random color for defaultColor directly without alerts
  const randomBtn = document.getElementById("randomColorBtn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      randomBtn.classList.add("btn-pressed-anim");
      setTimeout(() => randomBtn.classList.remove("btn-pressed-anim"), 250);
      generateRandomColor();
    });
  }

  // Keyboard shortcut: Spacebar generates a new random color when not typing
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    const activeEl = document.activeElement;
    const tag = activeEl ? activeEl.tagName.toLowerCase() : "";
    const isInput = tag === "input" || tag === "textarea" || tag === "select" || activeEl?.isContentEditable;
    const anyModalOpen = document.querySelector(".modal.is-active");

    if (!isInput && !anyModalOpen) {
      e.preventDefault();
      if (randomBtn) {
        randomBtn.classList.add("btn-pressed-anim");
        setTimeout(() => randomBtn.classList.remove("btn-pressed-anim"), 250);
      }
      generateRandomColor();
    }
  });

  // Export palette modal triggers (Top bar - all harmonies)
  const openExportBtn = document.getElementById("openExportModalBtn");
  if (openExportBtn) {
    openExportBtn.addEventListener("click", () => {
      openExportModalForHarmony("all");
    });
  }

  // Export scope dropdown inside modal
  const exportScopeSelect = document.getElementById("exportScopeSelect");
  if (exportScopeSelect) {
    exportScopeSelect.addEventListener("change", (e) => {
      renderExportCode(null, e.target.value);
    });
  }

  // Export format tab buttons
  document.querySelectorAll(".export-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.exportFormat;
      if (fmt) renderExportCode(fmt);
    });
  });

  // Copy exported code button
  const copyExportBtn = document.getElementById("copyExportCodeBtn");
  if (copyExportBtn) {
    copyExportBtn.addEventListener("click", () => {
      const previewEl = document.getElementById("exportCodePreview");
      if (!previewEl) return;
      copyToClipboard(previewEl.textContent);
      const btnText = document.getElementById("copyExportCodeBtnText");
      if (btnText) {
        const orig = btnText.textContent;
        btnText.textContent = "✓ ¡Código Copiado!";
        setTimeout(() => {
          btnText.textContent = orig;
        }, 1400);
      }
    });
  }

  // Save project button
  const saveBtn = document.getElementById("saveProjectBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentProject());
  }

  // Harmonies filter dropdown (Desktop & Tablet)
  const filterHarmoniesSelect = document.getElementById("harmoniesFilterSelect");
  if (filterHarmoniesSelect) {
    filterHarmoniesSelect.value = state.selectedHarmonyFilter;
    filterHarmoniesSelect.addEventListener("change", (e) => {
      state.selectedHarmonyFilter = e.target.value;
      renderHarmonies();
    });
  }

  // Mobile harmony selector dropdown (Smartphone only)
  const mobileHarmonySelect = document.getElementById("mobileHarmonySelect");
  const textColorHarmonySelect = document.getElementById("textColorHarmonySelect");

  if (mobileHarmonySelect) {
    mobileHarmonySelect.value = state.mobileSelectedHarmony;
    mobileHarmonySelect.addEventListener("change", (e) => {
      state.mobileSelectedHarmony = e.target.value;
      state.activeHarmony = e.target.value;
      if (textColorHarmonySelect) textColorHarmonySelect.value = e.target.value;
      renderTextColorsCard();
      updateMobileHarmonyVisibility();
    });
  }

  // Harmonic text colors accordion: always starts hidden by default
  const textAccordionToggle = document.getElementById("paletteTextAccordionToggle");
  const textAccordionCollapse = document.getElementById("paletteTextAccordionCollapse");
  const textColorsCard = document.getElementById("paletteTextColorsCard");

  if (textAccordionToggle && textAccordionCollapse && textColorsCard) {
    textAccordionCollapse.style.display = "none";
    textColorsCard.classList.add("is-collapsed");
    textColorsCard.classList.remove("is-expanded");
    textAccordionToggle.setAttribute("aria-expanded", "false");

    textAccordionToggle.addEventListener("click", () => {
      const isCurrentlyHidden = textAccordionCollapse.style.display === "none";
      if (isCurrentlyHidden) {
        textAccordionCollapse.style.display = "flex";
        textColorsCard.classList.remove("is-collapsed");
        textColorsCard.classList.add("is-expanded");
        textAccordionToggle.setAttribute("aria-expanded", "true");
        renderTextColorsCard();
      } else {
        textAccordionCollapse.style.display = "none";
        textColorsCard.classList.add("is-collapsed");
        textColorsCard.classList.remove("is-expanded");
        textAccordionToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Harmonic text colors card: harmony select & copy buttons
  if (textColorHarmonySelect) {
    textColorHarmonySelect.value = state.activeHarmony;
    textColorHarmonySelect.addEventListener("change", (e) => {
      state.activeHarmony = e.target.value;
      state.mobileSelectedHarmony = e.target.value;
      if (mobileHarmonySelect) mobileHarmonySelect.value = e.target.value;
      renderTextColorsCard();
      updateMobileHarmonyVisibility();
    });
  }

  const initTextCopyBtn = (btnId) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      if (!color) return;
      copyToClipboard(color);
      const hint = btn.querySelector(".palette-text-copy-hint");
      if (hint) {
        const orig = hint.textContent;
        hint.textContent = "✓ Copiado";
        setTimeout(() => {
          hint.textContent = orig;
        }, 1100);
      }
    });
  };
  initTextCopyBtn("copyDarkTextBtn");
  initTextCopyBtn("copyLightTextBtn");

  // Clicking any desktop harmony column to sync active text colors
  const harmoniesGridElem = document.getElementById("harmoniesGrid");
  if (harmoniesGridElem) {
    harmoniesGridElem.addEventListener("click", (e) => {
      const col = e.target.closest(".harmony-column");
      if (!col || e.target.closest(".color-card")) return;
      const key = col.dataset.harmonyKey;
      if (key) {
        state.activeHarmony = key;
        state.mobileSelectedHarmony = key;
        if (textColorHarmonySelect) textColorHarmonySelect.value = key;
        if (mobileHarmonySelect) mobileHarmonySelect.value = key;
        renderTextColorsCard();
      }
    });
  }

  // Saved projects modal trigger
  const openProjectsBtn = document.getElementById("openProjectsModalBtn");
  if (openProjectsBtn) {
    openProjectsBtn.addEventListener("click", () => {
      openModal("projectsModal");
      if (state.isLoggedIn) {
        loadUserProjects();
      }
    });
  }

  // Authentication modal buttons
  const openLoginBtn = document.getElementById("openLoginModalBtn");
  const openRegisterBtn = document.getElementById("openRegisterModalBtn");
  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => openModal("loginModal"));
  }
  if (openRegisterBtn) {
    openRegisterBtn.addEventListener("click", () => openModal("registerModal"));
  }

  // Switch between login and registration modals
  const switchRegisterBtn = document.getElementById("switchToRegisterBtn");
  const switchLoginBtn = document.getElementById("switchToLoginBtn");
  if (switchRegisterBtn) {
    switchRegisterBtn.addEventListener("click", () => {
      closeModal("loginModal");
      openModal("registerModal");
    });
  }
  if (switchLoginBtn) {
    switchLoginBtn.addEventListener("click", () => {
      closeModal("registerModal");
      openModal("loginModal");
    });
  }

  // Modal close triggers
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-close-modal");
      closeModal(target);
    });
  });

  // AJAX Login form handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/autenticacion/ingresar", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": getCsrfToken()
          },
          body: formData
        });

        const res = await response.json();
        if (res.status === "success") {
          showToast(res.message, "success");
          setTimeout(() => window.location.reload(), 600);
        } else {
          showToast(res.message || "Credenciales incorrectas.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al iniciar sesión.", "error");
      }
    });
  }

  // AJAX Register form handler
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/autenticacion/registro", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": getCsrfToken()
          },
          body: formData
        });

        const res = await response.json();
        if (res.status === "success") {
          showToast(res.message, "success");
          setTimeout(() => window.location.reload(), 600);
        } else {
          showToast(res.message || "Error al registrarse.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al registrar.", "error");
      }
    });
  }

  // Initialize Framework JS plugins (FloatingScroll & Modal)
  if (typeof window.floatingScroll === "function") {
    try {
      window.floatingScroll(8, "var(--color-primary-brand, #8b5cf6)", "");
    } catch (_) {}
  } else if (typeof window.FloatingScroll === "function") {
    try {
      new window.FloatingScroll(8, "var(--color-primary-brand, #8b5cf6)", "");
    } catch (_) {}
  }
  ensureAccessibleFloatingScroll();

  if (typeof window.modal === "function") {
    try {
      window.modal();
    } catch (_) {}
  }

  // Initial harmony rendering
  renderHarmonies({ isInitial: true });
}

/**
 * Garantiza que floating-scroll-track cumpla con los estándares de W3C ARIA,
 * Lighthouse y Agentic Browsing, evitando errores de IDREF roto y valores faltantes.
 */
function ensureAccessibleFloatingScroll() {
  if (typeof document === "undefined") return;

  if (document.body && !document.body.id) {
    document.body.id = "body";
  }

  const track = document.getElementById("floating-scroll-track");
  if (track) {
    track.setAttribute("aria-controls", "body");
    track.setAttribute("aria-orientation", "vertical");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    if (!track.hasAttribute("aria-valuenow")) {
      track.setAttribute("aria-valuenow", "0");
    }
    track.setAttribute("aria-label", "Barra de desplazamiento");
  }
}

// Auto-bootstrap on DOM ready in browser environment
if (typeof document !== "undefined") {
  ensureAccessibleFloatingScroll();

  if (typeof MutationObserver !== "undefined") {
    const scrollObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && (node.id === "floating-scroll-track" || node.querySelector?.("#floating-scroll-track"))) {
            ensureAccessibleFloatingScroll();
          }
        }
      }
    });

    const targetEl = document.body || document.documentElement;
    if (targetEl) {
      scrollObserver.observe(targetEl, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initColoristia);
  } else {
    initColoristia();
  }
}
