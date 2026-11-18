# Syntarion map standard

Every map made for Soteria follows one scale, so the grid, distances and zoom work with no setup.

## The rule

- **One square is one fathom, 6 feet.**
- **One square is 100 pixels of map art.**
- **The grid starts at the image's top-left corner.** Grid lines fall at 0, 100, 200 … pixels, across and down.
- **Map sizes are whole squares.** Width and height are multiples of 100 pixels, so the edges land on grid lines.

| Map | Squares | Image size |
| :-- | :-- | :-- |
| A room or small chamber | 12 × 10 | 1200 × 1000 px |
| A tavern, a camp | 20 × 15 | 2000 × 1500 px |
| A dungeon level or a mine | 30 × 20 | 3000 × 2000 px |
| A town quarter | 40 × 30 | 4000 × 3000 px |

Keep maps at or under about 40 × 30 squares (4000 × 3000 px). Larger maps load slowly on phones; split them into connected maps instead.

## Drawing to the standard

- **View:** straight top-down.
- **No grid lines in the art:** the app draws its own grid only when it's needed, so baked-in lines double up.
- **Scale cues:** a doorway is 1 square wide, a corridor 1–2, a table 1–2, a cart track about 1. A person fills about half a square.
- **Light sources:** paint lanterns, torches, braziers, crystals and lava as bright spots in darker surroundings. The app finds them and makes them flicker and glow (src/lib/ambience.js, findMapLights).
- **Format:** PNG or high-quality JPG, put in `public/Maps/`.

## Generating a map

Add this to any image-generation request:

> Top-down battle map, [W] × [H] squares at 100 pixels per square ([W×100] × [H×100] px), grid aligned to the top-left corner, no grid lines drawn, one square is six feet: doorways one square wide, corridors one to two squares wide. Light sources (lanterns, torches, crystals) painted as bright points in darker surroundings.

## In the app

- **A map made to the standard** gets its grid from the image size: a 3000-pixel-wide map is 30 squares across. Nothing to set.
- **An older map** that wasn't made to the standard: use **⌗ Set grid** on the map toolbar once and drag a box over one square's worth of the art. That fitted grid is saved with the map and overrides the standard.
- **▣ Square scale** (DM and players) zooms so one square is the same size on screen on every map.
- A turn's move is 5 squares (30 ft) — `MOVE_SQUARES` in `src/lib/grid.js`.
