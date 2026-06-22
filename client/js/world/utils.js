class SeededRandom {
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
window.rng = new SeededRandom(1024);
