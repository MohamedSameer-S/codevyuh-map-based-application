# Logic Dominion V1 Reference

This document captures the visual principles, implementation patterns, and lessons learned from the successful "Logic Dominion V1 Vertical Slice" polish pass. This reference serves as the blueprint for creating composed, living ecosystems in all subsequent regions.

## 1. Why V1 Succeeded Over Random-Scatter
The scene transitioned from looking like "random icons placed on green terrain" to a "stylized game-world ecosystem" because:
- **Authored Composition:** Instead of spraying randomized decorations via a seed, the layout was hand-composed using deliberate anchoring to create a campus hierarchy.
- **Scale Legibility:** Elements were boldly scaled up to match the massive default map zoom level, ensuring the district remained clearly visible without zooming in.
- **Terrain Integration:** Soft blurred base patches and local drop shadows anchored the structures natively to the grass, instead of feeling like flat stickers floating on top.

## 2. Visual Principles to Reuse
- **Large Readable Focal Landmark:** The region's core Landmark must be the undisputed visual centerpiece.
- **Visible District/Campus Footprint:** Use a distinct base layer (like the intersecting isometric stone plaza) to claim a zone for the civilization.
- **Terrain-First Scene Composition:** Shape the landscape (rivers, cliffs, plazas) first, then place buildings to fit the land.
- **Thick Readable Roads:** Connecting roads must use massive stroke widths (e.g., 140px base, 70px core) to remain legible as major travel paths at default zoom.
- **Grouped Canopy/Garden Masses:** Do not scatter single tiny trees. Group them into large, fluffy bounding canopies (e.g., radii of 600-800px) that frame the district, peppered with a few massive edge trees.
- **Label Offset:** Move the UI label (via `labelOffsetY` in config) precisely enough to avoid blocking the focal scene, while keeping it visually associated with the region.
- **Deterministic Placement:** Use relative anchoring to the region's main `rootX, rootY` to ensure the scene doesn't break if map coordinates shift.
- **No Tiny Random Scatter:** Discard micro-details (10px–50px scale) that simply vanish or look like noise at default zoom.

## 3. Implementation Patterns
- **Strict Z-Sorting Layering:** Use explicitly grouped `renderQueue` priorities (e.g., `zBasePatch`, `zRiver`, `zRoads`, `zPlaza`) relative to the root Y coordinate to prevent overlap breaking.
- **Bezier Rivers:** Replace straight stroke lines (`L`) with snaking multi-segment Bezier curves (`C`) using a dark bank polygon layered underneath a filled water polygon.
- **Stylized Secondary Buildings:** Abstract secondary structures using distinct, bold geometric silhouettes (e.g., multi-tiered library roofs, domes) utilizing `createPoly` rather than generic cubes.
- **Non-Destructive Scene Patches:** `<ellipse>` overlays using `mix-blend-mode: multiply` and `filter="blur(Xpx)"` are safe, performant ways to tint terrain transitions.

## 4. Mistakes to Never Repeat
- **Elements Too Small for Default Zoom:** Do not author 100px elements on a map designed for a 12,000px coordinate space.
- **Thin Line Rivers:** A 20px cyan stroke looks like a glowing cable, not a river.
- **Isolated Icon-like Landmarks:** A landmark without a surrounding footprint/district looks like a disconnected UI icon.
- **Random Tiny Props:** Spamming hundreds of tiny props creates visual clutter, not a coherent civilization.
- **Over-Aggressive Scaling:** Expanding a plaza to 5000px destroys map balance and eats neighboring regions.
- **Changing All Regions at Once:** Mass-refactoring the entire SVG ruins stability. Focus on one isolated Vertical Slice function at a time.

---

# Debug Wasteland Vertical Slice Planning

## Goal
Transform the Debug Wasteland from a scattered set of purple crystals and dead trees into a **corrupted broken civilization ecosystem**. It should feel like a ruined, dangerous territory surrounding a corrupted focal tower.

## Planned Elements
1. **Focal Ruin/Corrupted Tower Area:** The main Landmark will act as the corrupted heart. We will construct a cracked, ruined dark-stone foundation surrounding it.
2. **Cracked Dark Terrain Base:** A massive irregular terrain patch underneath the region using deep, bruised purples/greys with a multiply blend to visually poison the grass around it.
3. **Corruption River / Energy Scar:** Instead of water, a jagged, glowing purple/magenta fissure cutting across the land, leaking corruption.
4. **Broken Roads:** The road entering from the Logic Dominion bridge should shatter and splinter as it enters the wasteland, turning from stone into cracked dirt.
5. **Grouped Crystal Fields:** Replace random crystal scatter with dense, authored clusters of massive jagged crystals (Scale 15.0 - 20.0) emerging like spikes from the ground.
6. **Dead Tree Masses:** Group dead, thorny trees into oppressive, dense thickets using dark, unsaturated browns and greys.
7. **Small Ruined Buildings:** Author specific destroyed secondary structures (e.g., shattered domes, collapsed walls) around the main tower to show it used to be a civilization.
8. **Lock Cloud Visibility:** The white lock cloud must remain if the region is locked, but the towering crystals and glowing scars should subtly pierce through or tint the cloud to maintain identity.
9. **Label Offset:** Apply a custom `labelOffsetY` (likely negative, pushing it North) so it doesn't obscure the ruined courtyard.
10. **Scale Legibility:** All elements (crystals, ruins, scars) must be scaled appropriately (e.g., 2000px wide foundation, 500px wide corruption scars) to be immediately readable at default zoom.
