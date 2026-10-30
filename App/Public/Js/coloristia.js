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

  // Dynamic Lightness Range:
  // If user chooses an ultra-dark color (L0 <= 25): dark tolerance erased down to L0 (or 0 for black)
  // If user chooses an ultra-light color (L0 >= 75): light tolerance erased up to L0 (or 100 for white)
  // If user chooses intermediate (25 < L0 < 75): standard tolerances (15% to 90%)
  let Lmin = 15;
  let Lmax = 90;

  if (L0 <= 25) {
    Lmin = Math.max(0, Math.min(L0, 4));
    Lmax = 90;
  } else if (L0 >= 75) {
    Lmin = 15;
    Lmax = Math.min(100, Math.max(L0, 96));
  } else {
    Lmin = 15;
    Lmax = 90;
  }

  // Check if color is neutral grayscale (grays, black, white)
  const isAchromatic = S0 <= 2;

  for (let j = 0; j < effectiveK; j++) {
    const Mj = anchorCounts[j];
    const deltaH = activeShifts[j];

    for (let m = 0; m < Mj; m++) {
      let Ljm;
      if (Mj === 1) {
        Ljm = L0;
      } else if (j === 0) {
        // Seed anchor: smoothly interpolate through L0 so the user's selected shade is preserved
        const mAnchor = Math.max(0, Math.min(Mj - 1, Math.round(((L0 - Lmin) / (Lmax - Lmin || 1)) * (Mj - 1))));
        if (m === mAnchor) {
          Ljm = L0;
        } else if (m < mAnchor) {
          Ljm = Lmin + (m / (mAnchor || 1)) * (L0 - Lmin);
        } else {
          const denom = (Mj - 1 - mAnchor) || 1;
          Ljm = L0 + ((m - mAnchor) / denom) * (Lmax - L0);
        }
      } else {
        const deltaL = (Lmax - Lmin) / (Mj - 1);
        Ljm = Lmin + (m * deltaL);
      }

      // Parabolic saturation curve
      let Sjm;
      if (isAchromatic) {
        Sjm = 0;
      } else {
        const Dcentro = Math.abs(Ljm - 50) / 50;
        const minAllowedS = Math.min(S0, 15);
        Sjm = Math.max(minAllowedS, S0 * (1 - 0.45 * Math.pow(Dcentro, 2)));
      }

      // Bezold-Brücke effect: natural hue rotation (±6°)
      const microShift = isAchromatic ? 0 : ((Ljm - 50) / 50) * 6;
      let Hjm = normHue(H0 + deltaH + microShift);

      // Perceptual brightness compensation for single-anchor yellows/limes/cyans
      if (Mj === 1 && !isAchromatic && Hjm >= 45 && Hjm <= 160) {
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

// =========================================================================
// SECTION 2: FRONTEND UI & INTERACTION ORCHESTRATOR
// =========================================================================

/**
 * Global reactive application state.
 */
const state = {
  currentColor: "#C42127",
  variations: 6,
  colorSystem: "hex",
  isLoggedIn: false,
  projects: [],
  selectedHarmonyFilter: "primary",
  activeLoadedProject: null
};

/**
 * Displays a non-intrusive toast notification.
 *
 * @param {string} message Message text to display.
 * @param {string} type 'success' | 'error' | 'info'
 */
export function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} animate-fade-in`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
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
 * Renders chromatic harmonies grid and hero preview.
 */
export function renderHarmonies() {
  const data = generateAllHarmonies(state.currentColor, state.variations, "family");

  // Update central seed swatch preview and labels
  const heroSwatch = document.getElementById("heroColorSwatch");
  const heroLabel = document.getElementById("heroColorLabel");
  const baseColorLabel = document.getElementById("baseColorLabel");
  const projectNameInput = document.getElementById("projectNameInput");
  const quickColorTrigger = document.getElementById("quickColorTrigger");
  const quickColorCircle = document.getElementById("quickColorCircle");

  const isPureBlackOrWhite = (data.seed.hsl.l <= 2) || (data.seed.hsl.l >= 98);

  if (heroSwatch) {
    heroSwatch.style.backgroundColor = data.seed.hex;
    if (data.seed.hsl.l >= 98) {
      heroSwatch.style.boxShadow = `0 10px 40px -10px rgba(255,255,255,0.7), 0 0 35px rgba(255,255,255,0.5)`;
      heroSwatch.style.borderColor = "#ffffff";
    } else if (data.seed.hsl.l <= 2) {
      heroSwatch.style.boxShadow = `0 10px 40px -10px rgba(0,0,0,0.9), 0 0 25px rgba(255,255,255,0.15)`;
      heroSwatch.style.borderColor = "rgba(255, 255, 255, 0.4)";
    } else {
      heroSwatch.style.boxShadow = `0 10px 40px -10px ${data.seed.hex}88, 0 0 25px ${data.seed.hex}44`;
      heroSwatch.style.borderColor = "rgba(255, 255, 255, 0.95)";
    }
  }
  if (heroLabel) {
    heroLabel.textContent = data.seed.hex;
  }
  if (baseColorLabel) {
    baseColorLabel.textContent = isPureBlackOrWhite ? `${data.seed.hex} (Neutro)` : data.seed.hex;
  }
  if (quickColorTrigger) {
    quickColorTrigger.style.backgroundColor = data.seed.hex;
    quickColorTrigger.style.boxShadow = `0 0 14px ${data.seed.hex}88`;
  }
  if (quickColorCircle) {
    quickColorCircle.style.backgroundColor = data.seed.hex;
  }
  if (projectNameInput && (!projectNameInput.value || projectNameInput.dataset.auto === "true")) {
    projectNameInput.value = `Paleta Base ${data.seed.hex}`;
    projectNameInput.dataset.auto = "true";
  }

  // 5 primary harmony columns visible by default as seen in image 1
  const primaryKeys = [
    "monochromatic",
    "complementary",
    "analogousStandard",
    "triad",
    "splitComplementary"
  ];

  // Extended and auxiliary harmonies
  const extraKeys = [
    "analogousExtended",
    "analogousAccented",
    "tetradRectangular",
    "tetradSquare",
    "pentagon",
    "hexagon",
    "goldenRatio"
  ];

  // If pure black or white, only show monochromatic harmony
  const targetKeys = isPureBlackOrWhite
    ? ["monochromatic"]
    : (state.selectedHarmonyFilter === "extra"
      ? extraKeys
      : (state.selectedHarmonyFilter === "all" ? [...primaryKeys, ...extraKeys] : primaryKeys));

  const container = document.getElementById("harmoniesGrid");
  if (!container) return;

  container.innerHTML = "";

  targetKeys.forEach((key) => {
    const item = data.harmonies[key];
    if (!item) return;

    const column = document.createElement("div");
    column.className = "harmony-column flex-column gap12";

    const title = document.createElement("h3");
    title.className = "harmony-title text-center";
    title.textContent = isPureBlackOrWhite && key === "monochromatic" ? "Monocromática (Modo Neutro)" : item.rule.name;
    column.appendChild(title);

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards-stack flex-column gap8 w100";

    item.colors.forEach((colorObj) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "color-card";
      card.style.backgroundColor = colorObj.hex;
      card.style.color = colorObj.textColor;

      const formatted = formatColorValue(colorObj, state.colorSystem);

      card.innerHTML = `
        <span class="color-value font-mono">${formatted}</span>
        <span class="copy-hint">Copiar</span>
      `;

      card.addEventListener("click", () => {
        copyToClipboard(formatted);
      });

      cardsContainer.appendChild(card);
    });

    column.appendChild(cardsContainer);
    container.appendChild(column);
  });
}

/**
 * Updates current seed color and triggers re-render.
 *
 * @param {string} hex HEX color code.
 * @param {boolean} syncPicker Whether to update the custom picker handles.
 */
export function setSeedColor(hex, syncPicker = true) {
  let clean = hex.trim();
  if (!clean.startsWith("#")) {
    clean = "#" + clean;
  }
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
    return;
  }

  state.currentColor = clean.toUpperCase();

  if (syncPicker) {
    syncPickerFromColor(state.currentColor);
  }

  renderHarmonies();
}

/**
 * Modifies variation count between 6 and 16.
 *
 * @param {number} delta Step change (+1 or -1).
 */
export function changeVariations(delta) {
  const current = state.variations;
  const next = Math.max(6, Math.min(16, current + delta));
  if (next !== current) {
    state.variations = next;
    const countDisplay = document.getElementById("variationCountDisplay");
    if (countDisplay) {
      countDisplay.textContent = next;
    }
    renderHarmonies();
  }
}

/**
 * Verifies if the color can be changed.
 * If a saved palette from the user database is currently loaded, prompts for confirmation.
 *
 * @param {string} action Description of the intended action in Spanish.
 * @returns {boolean} True if confirmed or if no saved palette is loaded; false if cancelled.
 */
export function canChangeColor(action = "generar otro color") {
  if (!state.activeLoadedProject) {
    return true;
  }

  const projectName = state.activeLoadedProject.project_name || "Paleta guardada";
  const confirmed = window.confirm(
    `Tienes cargada la paleta guardada "${projectName}".\n\n¿Deseas ${action}?`
  );

  if (confirmed) {
    state.activeLoadedProject = null;
    renderProjectsList();
    return true;
  }

  return false;
}

/**
 * Generates a vibrant random seed color and applies it.
 */
export function generateRandomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(65 + Math.random() * 30);
  const l = Math.floor(40 + Math.random() * 25);
  const rgb = hslToRgb(h, s, l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  setSeedColor(hex);
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
 * Deletes a saved project from the database.
 *
 * @param {number} projectId
 */
export async function deleteProject(projectId) {
  if (!confirm("¿Deseas eliminar este proyecto?")) return;

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
      if (state.activeLoadedProject && Number(state.activeLoadedProject.id) === Number(projectId)) {
        state.activeLoadedProject = null;
      }
      state.projects = state.projects.filter((p) => Number(p.id) !== Number(projectId));
      renderProjectsList();
      showToast(res.message, "success");
    } else {
      showToast(res.message || "Error al eliminar.", "error");
    }
  } catch (err) {
    showToast("Error de conexión.", "error");
  }
}

/**
 * Renders the saved projects list inside the drawer modal.
 */
export function renderProjectsList() {
  const container = document.getElementById("projectsListContainer");
  if (!container) return;

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
    const isLoaded = state.activeLoadedProject && Number(state.activeLoadedProject.id) === Number(proj.id);
    const item = document.createElement("div");
    item.className = `project-item flex-row items-center justify-between gap12 p12 br8 ${isLoaded ? "project-item-active" : ""}`;

    item.innerHTML = `
      <div class="flex-row items-center gap12">
        <div class="project-color-preview br50" style="background-color: ${proj.hex_color}; width: 34px; height: 34px; border: 2px solid rgba(255,255,255,0.2);"></div>
        <div class="flex-column">
          <div class="flex-row items-center gap8">
            <span class="project-name bold600 text-white">${proj.project_name}</span>
            ${isLoaded ? '<span class="badge-active font-mono text-xs" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 500;">Cargada</span>' : ''}
          </div>
          <span class="project-hex font-mono text-xs text-inactive">${proj.hex_color} • ${proj.created_at || ""}</span>
        </div>
      </div>
      <div class="flex-row items-center gap8">
        <button type="button" class="btn btn-sm btn-outline load-project-btn" data-hex="${proj.hex_color}">${isLoaded ? 'Recargar' : 'Cargar'}</button>
        <button type="button" class="btn btn-sm btn-danger delete-project-btn" data-id="${proj.id}">Eliminar</button>
      </div>
    `;

    item.querySelector(".load-project-btn").addEventListener("click", () => {
      state.activeLoadedProject = {
        id: proj.id,
        project_name: proj.project_name,
        hex_color: proj.hex_color
      };

      const projectNameInput = document.getElementById("projectNameInput");
      if (projectNameInput) {
        projectNameInput.value = proj.project_name;
        projectNameInput.dataset.auto = "false";
      }

      setSeedColor(proj.hex_color);
      closeModal("projectsModal");
      showToast(`Cargada paleta: ${proj.project_name}`);
      renderProjectsList();
    });

    item.querySelector(".delete-project-btn").addEventListener("click", () => {
      deleteProject(proj.id);
    });

    container.appendChild(item);
  });
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
// SECTION 2.1: IN-APP CUSTOM COLOR PICKER
// =========================================================================

const pickerState = {
  h: 0,
  s: 1,
  v: 1,
  isOpen: false,
  activeTrigger: null
};

/**
 * Synchronizes the color picker UI handles and colors from current HSV.
 */
export function syncPickerUI() {
  const satValBox = document.getElementById("customPickerSatVal");
  const satValHandle = document.getElementById("customPickerSatValHandle");
  const hueBar = document.getElementById("customPickerHueBar");
  const hueHandle = document.getElementById("customPickerHueHandle");
  const hexInput = document.getElementById("customPickerHexInput");

  if (!satValBox || !satValHandle || !hueBar || !hueHandle) return;

  const pureHueHsl = `hsl(${Math.round(pickerState.h)}, 100%, 50%)`;
  satValBox.style.backgroundColor = pureHueHsl;

  satValHandle.style.left = `${pickerState.s * 100}%`;
  satValHandle.style.top = `${(1 - pickerState.v) * 100}%`;

  hueHandle.style.left = `${(pickerState.h / 360) * 100}%`;
  hueHandle.style.backgroundColor = pureHueHsl;

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
  const hsv = rgbToHsvNorm(rgb.r, rgb.g, rgb.b);
  pickerState.h = hsv.h;
  pickerState.s = hsv.s;
  pickerState.v = hsv.v;
  syncPickerUI();
}

/**
 * Opens the in-app custom color picker anchored to a trigger element.
 *
 * @param {HTMLElement} triggerEl
 */
export function openColorPicker(triggerEl) {
  if (state.activeLoadedProject) {
    if (!canChangeColor("seleccionar otro color")) {
      return;
    }
  }

  const popover = document.getElementById("coloristiaPickerPopover");
  if (!popover) return;

  pickerState.activeTrigger = triggerEl;
  pickerState.isOpen = true;

  if (triggerEl.id === "heroColorSwatch" || triggerEl.id === "heroColorLabel") {
    const heroContainer = document.querySelector(".hero-seed-container");
    if (heroContainer) {
      popover.style.top = "100%";
      popover.style.left = "50%";
      popover.style.transform = "translateX(-50%) translateY(14px)";
      heroContainer.appendChild(popover);
    }
  } else {
    const parent = triggerEl.parentElement || triggerEl;
    parent.style.position = "relative";
    popover.style.top = "calc(100% + 10px)";
    popover.style.left = "0";
    popover.style.transform = "none";
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
 * Initializes drag events and listeners for the custom color picker.
 */
function initCustomPickerEvents() {
  const satValBox = document.getElementById("customPickerSatVal");
  const hueBar = document.getElementById("customPickerHueBar");
  const hexInput = document.getElementById("customPickerHexInput");

  if (!satValBox || !hueBar) return;

  const updateSatVal = (e) => {
    const rect = satValBox.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    pickerState.s = x / rect.width;
    pickerState.v = 1 - (y / rect.height);

    const rgb = hsvNormToRgb(pickerState.h, pickerState.s, pickerState.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSeedColor(hex, false);
    syncPickerUI();
  };

  const updateHue = (e) => {
    const rect = hueBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const h = (x / rect.width) * 360;

    pickerState.h = normHue(h);

    const rgb = hsvNormToRgb(pickerState.h, pickerState.s, pickerState.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSeedColor(hex, false);
    syncPickerUI();
  };

  const setupDrag = (elem, onUpdate) => {
    let isDragging = false;
    elem.addEventListener("pointerdown", (e) => {
      isDragging = true;
      try { elem.setPointerCapture(e.pointerId); } catch (_) {}
      onUpdate(e);
    });
    elem.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      onUpdate(e);
    });
    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { elem.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    elem.addEventListener("pointerup", stopDrag);
    elem.addEventListener("pointercancel", stopDrag);
  };

  setupDrag(satValBox, updateSatVal);
  setupDrag(hueBar, updateHue);

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

  // Close on outside pointer click
  document.addEventListener("pointerdown", (e) => {
    const popover = document.getElementById("coloristiaPickerPopover");
    if (!popover || popover.style.display === "none") return;
    if (popover.contains(e.target)) return;
    if (e.target.closest("#heroColorSwatch") || e.target.closest("#quickColorTrigger") || e.target.closest("#heroColorLabel")) return;
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

  // Load initial state injected from PHP backend
  if (window.COLORISTIA_DATA) {
    state.isLoggedIn = !!window.COLORISTIA_DATA.isLoggedIn;
    state.colorSystem = window.COLORISTIA_DATA.colorSystem || "hex";
    state.projects = window.COLORISTIA_DATA.projects || [];
  }

  // Generate a random seed color on every page load / refresh
  const randH = Math.floor(Math.random() * 360);
  const randS = Math.floor(65 + Math.random() * 30);
  const randL = Math.floor(40 + Math.random() * 25);
  const initRgb = hslToRgb(randH, randS, randL);
  state.currentColor = rgbToHex(initRgb.r, initRgb.g, initRgb.b);

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

  // In-app custom color picker triggers
  const quickTrigger = document.getElementById("quickColorTrigger");
  const heroSwatch = document.getElementById("heroColorSwatch");
  const heroLabel = document.getElementById("heroColorLabel");

  if (quickTrigger) {
    quickTrigger.addEventListener("click", () => toggleColorPicker(quickTrigger));
  }
  if (heroSwatch) {
    heroSwatch.addEventListener("click", () => toggleColorPicker(heroSwatch));
  }
  if (heroLabel) {
    heroLabel.addEventListener("click", () => toggleColorPicker(heroSwatch));
  }

  // Random color button
  const randomBtn = document.getElementById("randomColorBtn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      if (!canChangeColor("generar un color aleatorio")) {
        return;
      }
      generateRandomColor();
    });
  }

  // Save project button
  const saveBtn = document.getElementById("saveProjectBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentProject());
  }

  // Harmonies filter dropdown
  const filterHarmoniesSelect = document.getElementById("harmoniesFilterSelect");
  if (filterHarmoniesSelect) {
    filterHarmoniesSelect.value = state.selectedHarmonyFilter;
    filterHarmoniesSelect.addEventListener("change", (e) => {
      state.selectedHarmonyFilter = e.target.value;
      renderHarmonies();
    });
  }

  // Saved projects modal trigger
  const openProjectsBtn = document.getElementById("openProjectsModalBtn");
  if (openProjectsBtn) {
    openProjectsBtn.addEventListener("click", () => {
      renderProjectsList();
      openModal("projectsModal");
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

  // Initial harmony rendering
  renderHarmonies();
}

// Auto-bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initColoristia);
} else {
  initColoristia();
}
