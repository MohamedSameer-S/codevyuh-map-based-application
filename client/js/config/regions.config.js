const CodeVyuhRegions = [
  {
    id: "logic",
    name: "Logic Dominion",
    theme: "logic",
    biome: "plains",
    x: 2000,
    y: 1500,
    width: 800,
    height: 600,
    elevation: 20,
    landmarkType: "academy",
    progress: 45,
    locked: false,
    neighbors: ["debug"],
    unlockCondition: null
  },
  {
    id: "debug",
    name: "Debug Wasteland",
    theme: "debug",
    biome: "rocky",
    x: 3200,
    y: 1200,
    width: 900,
    height: 700,
    elevation: 40,
    landmarkType: "fortress",
    progress: 10,
    locked: true,
    neighbors: ["logic", "systems"],
    unlockCondition: "Complete 60 more Logic Track labs to unlock"
  },
  {
    id: "systems",
    name: "Systems Republic",
    theme: "systems",
    biome: "coastal",
    x: 1500,
    y: 2400,
    width: 1000,
    height: 800,
    elevation: 10,
    landmarkType: "industrial",
    progress: 0,
    locked: true,
    neighbors: ["debug", "python"],
    unlockCondition: "Complete 90 more Debug Track labs to unlock"
  },
  {
    id: "python",
    name: "Python Wildlands",
    theme: "python",
    biome: "jungle",
    x: 3000,
    y: 2600,
    width: 900,
    height: 800,
    elevation: 30,
    landmarkType: "temple",
    progress: 0,
    locked: false,
    neighbors: ["systems"],
    unlockCondition: null
  }
];

// In a real app this would be exported or fetched via API
window.CodeVyuhRegions = CodeVyuhRegions;
