export interface ImageProcessingOptions {
  cropX: number;
  cropY: number;
  cropSize: number;
  removeBackground: boolean;
  backgroundColor: string; // hex
  bgTolerance: number;
  colorCount: number;
  smoothing: boolean;
}

export interface ImageToMatrixResult {
  matrix: number[][];
  palette: Record<number, string>;
}

export function cropImageToSquare(img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
  return canvas;
}

export function removeBackgroundByColor(canvas: HTMLCanvasElement, bgColorHex: string, tolerance: number): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const bgRgb = hexToRgb(bgColorHex);
  if (!bgRgb) return canvas;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    if (a > 0) {
      const dist = colorDistance(r, g, b, bgRgb.r, bgRgb.g, bgRgb.b);
      if (dist <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function resizeTo16x16(canvas: HTMLCanvasElement, smoothing: boolean): HTMLCanvasElement {
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = 16;
  targetCanvas.height = 16;
  const ctx = targetCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = smoothing;
  ctx.drawImage(canvas, 0, 0, 16, 16);
  return targetCanvas;
}

export function extractPalette(canvas: HTMLCanvasElement, colorCount: number): string[] {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, 16, 16);
  const data = imageData.data;

  const colorCounts = new Map<string, number>();
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // Ignore transparent or highly translucent pixels

    // Quantize slightly to group similar colors before counting
    const qR = Math.round(r / 16) * 16;
    const qG = Math.round(g / 16) * 16;
    const qB = Math.round(b / 16) * 16;
    
    const hex = rgbToHex(qR, qG, qB);
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // Sort colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  // Take top N colors
  return sortedColors.slice(0, Math.min(colorCount, 7));
}

export function mapPixelsToMatrix(canvas: HTMLCanvasElement, paletteColors: string[]): ImageToMatrixResult {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, 16, 16);
  const data = imageData.data;

  const palette: Record<number, string> = { 0: 'transparent' };
  for (let i = 0; i < paletteColors.length; i++) {
    palette[i + 1] = paletteColors[i];
  }

  const matrix: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) {
        row.push(0);
      } else {
        let closestIndex = 1;
        let minDistance = Infinity;

        // Find closest color in palette
        for (let p = 1; p <= paletteColors.length; p++) {
          const pRgb = hexToRgb(palette[p]);
          if (pRgb) {
            const dist = colorDistance(r, g, b, pRgb.r, pRgb.g, pRgb.b);
            if (dist < minDistance) {
              minDistance = dist;
              closestIndex = p;
            }
          }
        }
        row.push(closestIndex);
      }
    }
    matrix.push(row);
  }

  return { matrix, palette };
}

export async function processImageToMatrix(img: HTMLImageElement, options: ImageProcessingOptions): Promise<ImageToMatrixResult> {
  // 1. Crop
  let canvas = cropImageToSquare(img, options.cropX, options.cropY, options.cropSize);
  
  // 2. Remove Background
  if (options.removeBackground) {
    canvas = removeBackgroundByColor(canvas, options.backgroundColor, options.bgTolerance);
  }
  
  // 3. Resize to 16x16
  canvas = resizeTo16x16(canvas, options.smoothing);
  
  // 4. Extract Palette
  const paletteColors = extractPalette(canvas, options.colorCount);
  
  // 5. Map Pixels to Matrix
  return mapPixelsToMatrix(canvas, paletteColors);
}

// Helpers
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return '#' + [r, g, b].map(x => {
    const hex = clamp(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}
