// Convierte RGB a HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
  
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
    
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  
}

// Convierte HEX a HSL
export function hexToHsl(hex: string): [number, number, number] {

  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
  
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
    
  } else if (hex.length === 7) {
  
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
    
  }
  
  return rgbToHsl(r, g, b);
  
}

// Convierte HSL a RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {

  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  
}

// Convierte RGB a HEX
export function rgbToHex(r: number, g: number, b: number): string {

  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  
}

// Convierte HSL a HEX
export function hslToHex(h: number, s: number, l: number): string {

  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
  
}

// Convierte HSL a HSV
export function hslToHsv(h: number, s: number, l: number): [number, number, number] {

  s /= 100;
  l /= 100;
  const v = l + s * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);
  
  return [h, Math.round(sv * 100), Math.round(v * 100)];
  
}

// Genera una familia de un tono específico variando su luminosidad de oscuro a claro
const generateHueFamily = (h: number, s: number, count: number): [number, number, number][] => {

  const family: [number, number, number][] = [];
  const minL = 15;
  const maxL = 85;
  const step = (maxL - minL) / Math.max(1, count - 1);
  
  for (let i = 0; i < count; i++) {
  
    // De oscuro a claro
    family.push([h, s, Math.round(minL + step * i)]);
    
  }
  
  return family;
  
};

// Genera variaciones Monocromáticas usando HSL (modificando Lightness)
export function getMonochromaticVariations(h: number, s: number, l: number, count: number): [number, number, number][] {

  return generateHueFamily(h, s, count);
  
}

// Genera variaciones Analógicas usando HSL (modificando Hue)
export function getAnalogousVariations(h: number, s: number, l: number, count: number): [number, number, number][] {

  const colors: [number, number, number][] = [];
  const step = 60 / Math.max(1, count - 1);
  
  for (let i = 0; i < count; i++) {
  
    const newH = (h - 30 + (step * i) + 360) % 360;
    colors.push([Math.round(newH), s, l]);
    
  }
  
  return colors;
  
}

// Genera escalas complementarias (Agrupadas y ordenadas por luminosidad)
export function getComplementaryVariations(h: number, s: number, l: number, count: number): [number, number, number][] {

  const perFamily = Math.max(2, Math.floor(count / 2));
  const familyBase = generateHueFamily(h, s, perFamily);
  const familyComp = generateHueFamily((h + 180) % 360, s, perFamily);
  
  return [...familyBase, ...familyComp];
  
}

// Genera escalas Triádicas (Agrupadas y ordenadas por luminosidad)
export function getTriadicVariations(h: number, s: number, l: number, count: number): [number, number, number][] {

  const perFamily = Math.max(2, Math.floor(count / 3));
  const familyBase = generateHueFamily(h, s, perFamily);
  const familyTriad1 = generateHueFamily((h + 120) % 360, s, perFamily);
  const familyTriad2 = generateHueFamily((h + 240) % 360, s, perFamily);
  
  return [...familyBase, ...familyTriad1, ...familyTriad2];
  
}

// Genera escalas Complementario Dividido (Split-Complementary)
export function getSplitComplementaryVariations(h: number, s: number, l: number, count: number): [number, number, number][] {

  const perFamily = Math.max(2, Math.floor(count / 3));
  const familyBase = generateHueFamily(h, s, perFamily);
  const familySplit1 = generateHueFamily((h + 150) % 360, s, perFamily);
  const familySplit2 = generateHueFamily((h + 210) % 360, s, perFamily);
  
  return [...familyBase, ...familySplit1, ...familySplit2];
  
}
