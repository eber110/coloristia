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

  // Continuous, smooth lightness range:
  // Baseline: Lmin = 14%, Lmax = 90% (rich, vibrant darks without premature murky black collapse)
  // When L0 < 18%: smoothly scale Lmin down towards 0% using smoothstep curve (for near-black/black seeds)
  // When L0 > 82%: smoothly scale Lmax up towards 100% using smoothstep curve (for near-white/white seeds)
  let Lmin = 14;
  let Lmax = 90;

  if (L0 < 18) {
    const t = Math.max(0, L0 / 18);
    // Smooth cubic smoothstep curve (derivative is 0 at L0 = 18 for seamless C1 continuity)
    Lmin = 14 * (t * t * (3 - 2 * t));
  } else if (L0 > 82) {
    const t = Math.min(1, Math.max(0, (L0 - 82) / 18));
    // Smooth cubic smoothstep curve (derivative is 0 at L0 = 82 for seamless C1 continuity)
    Lmax = 90 + 10 * (t * t * (3 - 2 * t));
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
  defaultColor: "#C42127",
  activeSlot: "default",
  userPalettes: [],
  variations: 15,
  colorSystem: "hex",
  isLoggedIn: false,
  projects: [],
  selectedHarmonyFilter: "primary",
  isInitialRender: true,
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
          <div id="heroColorSwatch"
               class="hero-color-circle ${isDefaultActive ? "hero-circle-active" : ""}"
               data-action="circle-default"
               data-hex="${state.defaultColor}"
               style="background-color: ${state.defaultColor};"
               title="Haz clic para seleccionar o usar el color base">
          </div>
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
  card.dataset.formattedColor = formatted;
  card.innerHTML = `
    <span class="color-value font-mono">${formatted}</span>
    <span class="copy-hint">${isColumnDisabled ? "Inactiva" : "Copiar"}</span>
  `;

  card.addEventListener("click", () => {
    if (card.disabled || card.getAttribute("aria-disabled") === "true") return;
    copyToClipboard(card.dataset.formattedColor || formatted);
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

  // Update hero swatches and labels
  renderHeroSeed({ skipTrackRebuild: !!options.skipHeroRebuild });

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

  const targetKeys = state.selectedHarmonyFilter === "extra"
    ? extraKeys
    : (state.selectedHarmonyFilter === "all" ? [...primaryKeys, ...extraKeys] : primaryKeys);

  const container = document.getElementById("harmoniesGrid");
  if (!container) return;

  const isInitial = options.isInitial || state.isInitialRender;
  const variationChange = options.variationChange || null;

  // Check if existing columns match target keys
  const existingColumns = container.querySelectorAll(".harmony-column");
  const columnKeyMap = {};
  existingColumns.forEach((col) => {
    if (col.dataset.harmonyKey) {
      columnKeyMap[col.dataset.harmonyKey] = col;
    }
  });

  const columnsMatch = targetKeys.length === existingColumns.length &&
    targetKeys.every((k) => !!columnKeyMap[k]);

  if (!columnsMatch) {
    container.innerHTML = "";
    targetKeys.forEach((key) => {
      const item = data.harmonies[key];
      if (!item) return;

      const isColumnDisabled = isPureBlackOrWhite && key !== "monochromatic";
      const column = document.createElement("div");
      column.className = `harmony-column flex-column gap12 ${isColumnDisabled ? "harmony-column-disabled" : ""}`;
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
    targetKeys.forEach((key) => {
      const item = data.harmonies[key];
      const column = columnKeyMap[key];
      if (!item || !column) return;

      const isColumnDisabled = isPureBlackOrWhite && key !== "monochromatic";
      if (isColumnDisabled) {
        column.classList.add("harmony-column-disabled");
      } else {
        column.classList.remove("harmony-column-disabled");
      }

      const title = column.querySelector(".harmony-title");
      if (title) {
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

  state.isInitialRender = false;
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
          <span class="project-date font-mono text-xs text-inactive">${proj.created_at || ""}</span>
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

  // Load initial state injected from PHP backend
  if (window.COLORISTIA_DATA) {
    state.isLoggedIn = !!window.COLORISTIA_DATA.isLoggedIn;
    state.colorSystem = window.COLORISTIA_DATA.colorSystem || "hex";
    state.projects = window.COLORISTIA_DATA.projects || [];
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

  // Load user palettes from localStorage memory only if user has saved projects
  loadUserPalettesFromStorage();
  if (!state.projects || state.projects.length === 0) {
    state.userPalettes = [];
    saveUserPalettesToStorage();
  } else {
    // Only keep palettes that exist in user's saved projects
    state.userPalettes = state.userPalettes.filter((p) =>
      state.projects.some((proj) => Number(proj.id) === Number(p.id) || (proj.hex_color && p.hex && proj.hex_color.toUpperCase() === p.hex.toUpperCase()))
    );
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

  if (typeof window.modal === "function") {
    try {
      window.modal();
    } catch (_) {}
  }

  // Initial harmony rendering
  renderHarmonies({ isInitial: true });
}

// Auto-bootstrap on DOM ready in browser environment
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initColoristia);
  } else {
    initColoristia();
  }
}
