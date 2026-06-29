export class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Helper for range
  range(min, max) {
    return min + this.next() * (max - min);
  }
}

// Global deterministic random generator
export const rng = new SeededRandom(1024);
if (typeof window !== 'undefined') {
  window.rng = rng;
}
