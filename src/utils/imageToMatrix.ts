export interface ImageToMatrixOptions {
  alphaThreshold: number;
  colorCount: number;
  smoothing: boolean;
}

export interface ImageToMatrixResult {
  matrix: number[][];
  palette: Record<number, string>;
}

export async function imageToMatrix(file: File, options: ImageToMatrixOptions): Promise<ImageToMatrixResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const result = processImage(img, options);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function processImage(img: HTMLImageElement, options: ImageToMatrixOptions): ImageToMatrixResult {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Crop to square and resize
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;

  ctx.imageSmoothingEnabled = options.smoothing;
  ctx.drawImage(img, sx, sy, size, size, 0, 0, 16, 16);

  const imageData = ctx.getImageData(0, 0, 16, 16);
  const data = imageData.data;

  // Extract unique colors (ignoring transparent)
  const colorCounts = new Map<string, number>();
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < options.alphaThreshold) continue;

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

  // Take top N colors (max 7)
  const paletteColors = sortedColors.slice(0, Math.min(options.colorCount, 7));
  
  const palette: Record<number, string> = { 0: 'transparent' };
  for (let i = 0; i < paletteColors.length; i++) {
    palette[i + 1] = paletteColors[i];
  }

  // Map pixels to matrix
  const matrix: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < options.alphaThreshold) {
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

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return '#' + [r, g, b].map(x => {
    const hex = clamp(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}
