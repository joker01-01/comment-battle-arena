/**
 * Parses a string input into a 16x16 pixel matrix.
 * Uses a 3-tier parsing strategy for robustness:
 * 1. Tries to extract the `matrix: [...]` field.
 * 2. Tries to extract the first standard 2D array `[[...], [...]]`.
 * 3. Falls back to extracting the first 256 valid digits (0-7), ignoring hex colors.
 */
export function parsePixelMatrix(input: string): number[][] {
  // Helper to parse a string that looks like a 2D array
  const parse2DArray = (str: string): number[][] | null => {
    const digits = str.match(/\d/g)?.map(Number).filter(n => n >= 0 && n <= 7);
    if (digits && digits.length >= 256) {
      const matrix: number[][] = [];
      for (let i = 0; i < 16; i++) {
        matrix.push(digits.slice(i * 16, (i + 1) * 16));
      }
      return matrix;
    }
    return null;
  };

  // 1. Try to find matrix: [...]
  const matrixFieldMatch = input.match(/matrix\s*:\s*(\[\s*\[[\s\S]*?\]\s*\])/);
  if (matrixFieldMatch) {
    const parsed = parse2DArray(matrixFieldMatch[1]);
    if (parsed) return parsed;
  }

  // 2. Try to find the first 2D array [[...], [...]]
  const arrayMatch = input.match(/\[\s*\[[\s\S]*?\]\s*\]/);
  if (arrayMatch) {
    const parsed = parse2DArray(arrayMatch[0]);
    if (parsed) return parsed;
  }

  // 3. Loose fallback: remove hex colors and extract 256 digits
  // Remove hex colors like #fff, #ffffff, #12345678 to prevent them from polluting the matrix
  const noHex = input.replace(/#[0-9a-fA-F]{3,8}/g, '');
  const matches = noHex.match(/\d/g);
  
  if (!matches) {
    throw new Error('No numbers found in input.');
  }

  const validNumbers = matches.map(n => parseInt(n, 10)).filter(n => n >= 0 && n <= 7);

  if (validNumbers.length < 256) {
    throw new Error(`Not enough valid numbers (0-7). Found ${validNumbers.length}, expected at least 256 for a 16x16 matrix.`);
  }

  const matrix: number[][] = [];
  for (let i = 0; i < 16; i++) {
    matrix.push(validNumbers.slice(i * 16, (i + 1) * 16));
  }

  return matrix;
}
