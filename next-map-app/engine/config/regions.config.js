const CodeVyuhRegions = [
  {
    id: "logic",
    name: "Logic Dominion",
    theme: "logic",
    biome: "plains",
    x: -476,
    y: -742,
    width: 800,
    height: 600,
    landmarkType: "academy",
    labelOffsetX: 0,
    labelOffsetY: 645,
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
    x: 6076,
    y: -742,
    width: 900,
    height: 700,
    elevation: 40,
    landmarkType: "fortress",
    labelOffsetY: -900,
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
    x: -476,
    y: 5342,
    width: 1000,
    height: 800,
    elevation: 10,
    landmarkType: "industrial",
    labelOffsetY: 1500,
    cloudScale: 0.65,
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
    x: 6076,
    y: 5342,
    width: 900,
    height: 800,
    elevation: 30,
    landmarkType: "temple",
    labelOffsetY: 1000,
    progress: 0,
    locked: false,
    neighbors: ["systems"],
    unlockCondition: null
  }
];

// In a real app this would be exported or fetched via API
export default CodeVyuhRegions;
