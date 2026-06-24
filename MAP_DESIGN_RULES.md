# CodeVyuh Map Design Rules

## Main Goal

Upgrade the existing CodeVyuh world map from the current SVG prototype into a colorful, scalable, stylized cartoon/isometric strategy-game map similar to the provided Image 3 reference.

The goal is not AAA realism.

The goal is a clean, readable, colorful, student-friendly, scalable, game-like world map that is achievable using code.

The map should feel like:

* a learning world
* an explorable island map
* a strategy-game map
* a region-based progression system
* a never-ending expandable world

## Most Important Rule

Do not destroy the existing foundation of the map.

The current map foundation must be preserved and improved, not replaced.

The design must evolve from the current SVG-based map into a better version closer to the Image 3 concept style.

Do not create a completely new unrelated map.

Do not convert the map into one static image.

Do not hardcode everything.

Do not remove scalability.

## Visual Target

The target style is Image 3 style:

* colorful cartoon island map
* clean strategy-game look
* stylized forests
* stylized mountains
* rivers and lakes
* beaches and coastlines
* clear region labels
* soft fog/clouds for locked regions
* readable landmarks
* bright educational adventure feeling

Avoid Image 2 / AAA realistic style:

* do not make it photorealistic
* do not make it cinematic
* do not make it overly dark
* do not add excessive tiny details
* do not use raster images as the main map
* do not move away from SVG-friendly design

## Core Foundation That Must Stay

The map must always remain:

* scalable
* region-based
* data-driven
* expandable
* suitable for future regions
* compatible with locked and unlocked regions
* compatible with fog-of-war
* compatible with click interactions
* suitable for camera pan and zoom
* suitable for a never-ending map experience

The map must not become a single flat illustration.

The map must remain a game system.

## Required Regions

The map must keep these four major learning regions:

1. Logic Dominion
2. Debug Realm
3. Systems Frontier
4. Python Wildlands

Each region must have its own identity, landmark, terrain style, and unlock state.

## Region Identity Rules

### Logic Dominion

Mood:
Bright, clean, peaceful, academic, beginner-friendly.

Visuals:

* academy
* castle
* knowledge hall
* coding citadel
* bridges
* grasslands
* rivers
* small learning village elements

Purpose:
Logic, reasoning, algorithms, basic problem solving.

### Debug Realm

Mood:
Mysterious, corrupted, locked, dark-purple, broken.

Visuals:

* ruined tower
* broken fortress
* corrupted land
* purple crystals
* fog
* cracked terrain
* glitch-like details

Purpose:
Debugging, bug fixing, error solving, code repair.

### Systems Frontier

Mood:
Industrial, mechanical, engineering-focused.

Visuals:

* factory
* gear city
* power plant
* rail tracks
* pipes
* mechanical roads
* smoke
* rocky land

Purpose:
Systems thinking, backend, architecture, databases, engineering logic.

### Python Wildlands

Mood:
Green, natural, jungle-like, exploratory.

Visuals:

* jungle temple
* forest shrine
* tropical trees
* waterfalls
* vines
* green sanctuary

Purpose:
Python, automation, scripting, simple coding, creative problem solving.

## Technical Architecture Rule

Use the following architecture:

Three.js layer:

* world depth
* terrain enhancement
* water depth
* atmosphere
* camera feel
* optional lighting enhancement

SVG layer:

* region overlays
* region boundaries
* labels
* icons
* lock badges
* progress indicators
* fog masks
* clickable regions
* decorative vector objects

HTML/CSS layer:

* popups
* buttons
* panels
* navigation UI
* mission cards
* progress display

JavaScript layer:

* rendering logic
* region state
* unlock logic
* interaction logic
* camera logic
* data-driven map generation

Important:
Three.js must enhance the map.
Three.js must not replace the SVG region system.

## SVG Layer Rules

The SVG map must stay organized into clear layers.

Required SVG layers:

* oceanLayer
* baseTerrainLayer
* terrainPatchLayer
* waterLayer
* roadLayer
* forestLayer
* mountainLayer
* buildingLayer
* cloudLayer
* regionOverlayLayer
* uiLayer

Do not mix all objects into one layer.

Each layer should have a clear purpose.

## Scalability Rules

The map must be generated from data wherever possible.

Region data should support:

* id
* name
* unlocked
* locked
* progress
* terrainType
* landmarkType
* position
* bounds
* connectedRegions
* requiredLevel
* description

Adding a new region later should require adding a new data object, not rewriting the whole SVG manually.

## Locked and Unlocked Region Rules

Unlocked regions:

* should be clearly visible
* should have readable labels
* should have active landmarks
* should support click interactions
* should show progress or region status

Locked regions:

* should be partially hidden by fog/clouds
* should show lock symbols
* should not feel fully accessible
* should still hint that something exists behind the fog
* should be unlockable later through progress logic

## Fog-of-War Rules

Fog/clouds must be controlled and purposeful.

Clouds should:

* cover locked regions only
* not cover unlocked regions heavily
* avoid giant random cloud blobs
* be smaller and layered
* use opacity variation
* support animation
* support fade-out when unlocked
* use pointer-events: none unless blocking clicks is intentional

Fog should create a sense of mystery and future expansion.

## Never-Ending Map Feeling

The map should feel larger than the currently visible area.

Use:

* edge fog
* ocean continuation
* small islands
* partial paths leading outward
* hidden future zones
* expandable region data
* camera movement support

Do not make the map feel like a closed poster.

## Terrain Rules

The terrain should move closer to Image 3 style.

Improve the flat green-board feeling by adding:

* grass patches
* forest ground zones
* rocky patches
* sandy beaches
* small hills
* elevation shadows
* curved coastlines
* small land details

Keep it stylized and SVG-friendly.

## Water Rules

Water should feel more natural and attractive.

Add:

* irregular lakes
* continuous rivers
* shallow turquoise edges
* deeper blue inner water
* shoreline highlights
* small wave strokes
* bridges where needed
* river branches where useful

Do not use flat single-color water only.

## Forest Rules

Forests should not look like repeated random trees.

Use:

* clusters
* varied tree sizes
* varied spacing
* different shades of green
* dense forest zones
* small clearings
* SVG symbols and reuse where possible

## Mountain Rules

Mountains should not be isolated repeated icons only.

Use:

* mountain groups
* ridge-like arrangements
* varied sizes
* snow caps on taller mountains
* shadow side and highlight side
* rocky base patches

Keep them cartoon/isometric and code-friendly.

## Landmark Rules

Each region must have one strong landmark.

Landmarks should be bigger and more meaningful than small icons.

They must be SVG-friendly or simple Three.js-friendly.

Do not import image assets.

Logic Dominion landmark:
academy / castle / knowledge citadel

Debug Realm landmark:
broken tower / corrupted fortress / purple crystal ruin

Systems Frontier landmark:
factory / mechanical base / gear city

Python Wildlands landmark:
jungle temple / forest shrine / ancient coding sanctuary

## UI Rules

Keep the main view focused on the map.

Avoid:

* heavy dashboard clutter
* unnecessary sidebars
* unrelated cards
* design system boards
* mobile mockup layouts
* white canvas background

Allowed UI:

* region labels
* lock icons
* progress badges
* small map title
* selected region popup
* minimal navigation controls

## Design Direction

The map should look:

* colorful
* readable
* playful but not childish
* student-friendly
* adventure-like
* scalable
* polished
* SVG-friendly
* closer to Image 3 than Image 2

## Do Not Do

Do not use the concept image as a direct asset.

Do not import PNG/JPG map backgrounds.

Do not flatten the world into one static image.

Do not remove region logic.

Do not remove locked/unlocked logic.

Do not remove fog-of-war logic.

Do not remove click interactions.

Do not remove scalability.

Do not make the design too realistic.

Do not chase AAA realism.

Do not generate a dashboard instead of the map.

Do not rewrite the whole project unless explicitly requested.

Do not break existing working behavior.

## Implementation Process

Make changes phase by phase.

Before modifying code:

1. Inspect the current structure.
2. Identify affected files.
3. Explain the planned change.
4. Modify only required files.
5. Preserve existing behavior.
6. Test visually.
7. Summarize what changed.

Never make huge uncontrolled changes.

## Required Workflow Before Every Map Change

Before changing the map, always read this file first.

Then confirm:

* which part of the map will be changed
* which files will be modified
* which existing features will be preserved
* how the change moves the map closer to Image 3 style

## Acceptance Checklist

After every map update, verify:

1. Are all four regions still present?
2. Are regions still data-driven?
3. Are locked regions still locked?
4. Is fog connected to locked regions?
5. Are unlocked regions still visible?
6. Are regions still clickable?
7. Can future regions still be added?
8. Are SVG layers still organized?
9. Did the update avoid raster map assets?
10. Did the design move closer to Image 3 style?
11. Did it avoid becoming Image 2 / AAA realistic style?
12. Did it preserve the never-ending world feeling?

## Final Direction

The final CodeVyuh map should become:

A scalable, interactive, region-based, SVG-friendly learning world map with colorful cartoon/isometric terrain, locked and unlocked regions, controlled fog-of-war, iconic landmarks, expandable future zones, and a clean strategy-game feeling similar to Image 3.

## Concept Image Territory Logic

The concept image should be treated as the main visual direction for how the world is distributed.

The four regions should not be treated as mathematical quadrants or grid sections.

They should feel like natural real-world territories inside one connected landmass.

Each region should own a large surrounding ecosystem:

- Logic Dominion owns a peaceful academy/knowledge kingdom territory.
- Debug Realm owns a corrupted broken wasteland territory.
- Systems Frontier owns an industrial engineering civilization territory.
- Python Wildlands owns a lush jungle temple civilization territory.

Regions should be separated naturally using:

- rivers
- lakes
- forests
- mountain groups
- roads
- bridges
- fog
- terrain color changes
- ecosystem density

Do not use straight divider lines, cross-shaped rivers, square borders, or grid-like quadrant separators.

Water should flow naturally like a real map:
- from mountain or highland areas
- through curved river paths
- around region cores
- into lakes or coastlines
- with bridges only where paths cross water

Forests should form clusters based on ecosystem identity, not random repeated scattering.

Mountains should form groups and ridges based on terrain logic, not isolated repeated icons.

The goal is to make the regions feel like living territories in one world, similar to the approved concept image, while preserving the scalable SVG-based map system.