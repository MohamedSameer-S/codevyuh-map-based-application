const BiomeConfig = {
  plains: {
    baseColor: "#7b9e59",
    highlightColor: "#8bc34a",
    treeType: "pine",
    landmarkShadow: "rgba(0, 50, 0, 0.4)",
    propScattering: 0.8 // High density of trees
  },
  wasteland: {
    baseColor: "#455a64",
    highlightColor: "#78909c",
    treeType: "dead",
    landmarkShadow: "rgba(30, 0, 50, 0.6)",
    propScattering: 0.2 // Low density
  },
  coastal: {
    baseColor: "#689f38",
    highlightColor: "#aed581",
    treeType: "palm",
    landmarkShadow: "rgba(0, 30, 80, 0.4)",
    propScattering: 0.5
  },
  jungle: {
    baseColor: "#1b5e20",
    highlightColor: "#33691e",
    treeType: "jungle",
    landmarkShadow: "rgba(10, 30, 0, 0.6)",
    propScattering: 0.9
  }
};

window.BiomeConfig = BiomeConfig;
