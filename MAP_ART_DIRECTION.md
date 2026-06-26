# MAP ART DIRECTION

This document defines the fixed visual soul of the CodeVyuh map. It serves as the permanent design rulebook for all future map rendering updates.

## 1. Final Visual Goal

*   The map must feel like a stylized SVG game-world ecosystem inspired by concept art.
*   It should not look like random SVG icons placed on terrain.
*   It should feel like four living civilizations surrounded by water.
*   The visual target is not exact realism, but a rich stylized SVG world.

## 2. Camera and View Rules

*   Default view must show a beautiful readable world map.
*   The map should be top-down / slight 2.5D drone style.
*   No 3D rotation.
*   The user should pan only within map bounds.
*   Details must be readable at default zoom, not only after zooming in.

## 3. Ecosystem Philosophy

*   Terrain comes first, props come last.
*   Each region must be recognizable from terrain color, shape, atmosphere, and landmark silhouette before small props are added.
*   Props must belong to scene clusters, not random scatter.
*   Forests must appear as canopy masses first, individual trees second.
*   Mountains must appear as connected ranges, not isolated repeated icons.
*   Rivers must shape the land, not look like lines drawn on top.
*   Roads must connect meaningful places, not stab directly into centers.

## 4. Region Identity Rules

### Logic Dominion
*   Peaceful ancient academy civilization.
*   Emerald, cyan, white, soft stone, clean grass.
*   Rivers, bridges, libraries, temples, academy houses, gardens.
*   Organized but natural layout.

### Debug Wasteland
*   Corrupted broken civilization.
*   Purple, dark grey, cracked earth, glitch energy.
*   Broken roads, dead trees, crystals, ruined towers.
*   Should look damaged but not visually chaotic.

### Systems Republic
*   Engineering/industrial civilization.
*   Steel, orange energy, dark green/brown terrain, factories.
*   Pipes, gears, railways, dams, energy cores.
*   Mechanical but still readable.

### Python Wildlands
*   Jungle, ancient ruins, waterfalls, wildlife.
*   Deep green, moss, stone, water, vines.
*   Dense nature but not cluttered.

## 5. Scale and Readability Rules

*   Large map details must be readable at default zoom.
*   Rivers should be broad landscape features.
*   Landmarks should be large focal points.
*   Props should never appear as tiny dots.
*   Thin strokes are forbidden for important visuals.
*   Each important element must have enough size, contrast, and spacing.

## 6. Layering Rules

The SVG should follow this visual order from bottom to top:

1.  Ocean / background water
2.  Landmass
3.  Terrain zones
4.  Rivers and lakes
5.  River banks and terrain blending
6.  Roads and bridges
7.  Large natural masses
8.  Landmarks
9.  Scene clusters
10. Small props
11. Shadows and highlights
12. Fog/cloud/lock layer
13. Interaction markers

## 7. Forbidden Mistakes

Explicitly avoid:

*   Random prop scatter.
*   Repeated same-size trees.
*   Isolated mountain icons.
*   Thin rivers.
*   Roads that cut unnaturally across regions.
*   Excessive tiny decorations.
*   Black locked overlays.
*   Unclear region identity.
*   Cluttered scenes.
*   Changing unrelated working features.
*   Making the whole map larger or smaller without request.
*   Destroying existing camera constraints.
*   Replacing the map with a totally different UI.

## 8. Visual Acceptance Checklist

Before marking any visual phase as complete, check:

*   [ ] Can each region be recognized within 2 seconds?
*   [ ] Does the default zoom look beautiful?
*   [ ] Are the big terrain shapes strong before props?
*   [ ] Do rivers feel like real world features?
*   [ ] Do roads connect meaningful places?
*   [ ] Are props grouped into scenes?
*   [ ] Is there clear visual hierarchy?
*   [ ] Is the result less cluttered than before?
*   [ ] Does the ecosystem feel like a living world rather than SVG decoration?
