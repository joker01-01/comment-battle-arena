export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // LCG (Linear Congruential Generator)
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }

  nextBoolean(): boolean {
    return this.next() >= 0.5;
  }
}
