# Project Prompt: GeoJSON Studio — Build Order #1

> **Stack:** SvelteKit + MapLibre GL JS + Turf.js
> **Hosting:** Vercel or GitHub Pages
> **Difficulty:** Beginner–Intermediate | No API keys required | Pure front-end
> **Package Manager:** Use `bun` (preferred) or `pnpm` as an alternative to npm. All commands in this guide use `bun`. Swap `bun add` → `pnpm add` and `bunx` → `pnpm dlx` if you prefer pnpm.

---

## Project Vision

Build a browser-based GeoJSON editor and visualizer — think a lightweight, open-source alternative to geojson.io. Users can paste or upload GeoJSON, see it rendered on a map, run geometric operations on it (buffer, simplify, union, area), toggle layer styling, and export the result. The entire app runs client-side with zero backend. This project is your Svelte + MapLibre training ground.

---

## What You're Building (Feature List)

### Core MVP (build these first)
1. **Map Canvas** — Full-screen MapLibre GL JS map with basemap switcher (OSM Streets, Satellite, Light, Dark)
2. **GeoJSON Input Panel** — Left sidebar with a code editor (textarea or CodeMirror-lite) where users paste raw GeoJSON
3. **File Upload** — Drag-and-drop or click-to-upload `.geojson` and `.json` files
4. **Live Layer Rendering** — Instantly render uploaded/pasted GeoJSON as fill + outline + point layers on the map
5. **Layer List** — A list of loaded layers with toggle visibility, rename, and delete controls
6. **Export** — Download the current (possibly modified) GeoJSON as a `.geojson` file

### Enhanced Features (build after MVP works)
7. **Geometry Inspector** — Click any feature on the map to show a popup with its properties in a table
8. **Turf.js Operations Panel** — A toolbar with buttons for:
   - Buffer (with distance input in meters/km)
   - Simplify (tolerance slider)
   - Dissolve/Union (merge all features)
   - Calculate Area / Length (shown in results panel)
   - Centroid (add centroid points layer)
   - Bounding Box (fit map + draw bbox)
9. **Style Editor** — Per-layer color pickers for fill color, outline color, opacity slider, point radius
10. **Multi-Layer Support** — Load multiple GeoJSON files as separate named layers
11. **URL Share** — Encode small GeoJSON into URL hash so users can share links (compress with LZ-string)
12. **Coordinate Display** — Show lat/lng of mouse cursor in bottom bar
13. **Dark/Light Mode** — Toggle with Svelte's reactive stores

---

## Tech Stack Details

| Tool | Purpose | Install |
|------|---------|---------|
| SvelteKit | App framework, routing, SSR-off mode | `bunx sv create` |
| MapLibre GL JS | Open-source WebGL map renderer | `bun add maplibre-gl` |
| Turf.js | Client-side geospatial operations | `bun add @turf/turf` |
| LZ-String | URL compression for share links | `bun add lz-string` |
| svelte-codemirror-editor (optional) | Syntax-highlighted JSON editor | `bun add svelte-codemirror-editor` |

---

## File & Folder Structure

```
geojson-studio/
├── src/
│   ├── routes/
│   │   └── +page.svelte          # Main app layout
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Map.svelte         # MapLibre wrapper
│   │   │   ├── Sidebar.svelte     # Left panel container
│   │   │   ├── LayerList.svelte   # Layer toggles + controls
│   │   │   ├── JsonEditor.svelte  # Textarea / CodeMirror panel
│   │   │   ├── StyleEditor.svelte # Color pickers per layer
│   │   │   ├── TurfPanel.svelte   # Geometry operation buttons
│   │   │   ├── FeaturePopup.svelte# Click-to-inspect popup
│   │   │   └── Toolbar.svelte     # Top bar (upload, export, basemap)
│   │   ├── stores/
│   │   │   ├── layers.js          # Svelte writable store for all layers
│   │   │   ├── mapInstance.js     # Writable store holding MapLibre map ref
│   │   │   └── ui.js              # Sidebar open/close, dark mode, active tool
│   │   └── utils/
│   │       ├── geojson.js         # Parse, validate, generate unique IDs
│   │       ├── turf-ops.js        # Wrapper functions for each Turf operation
│   │       ├── export.js          # Download GeoJSON helper
│   │       └── url-share.js       # LZ-string encode/decode
│   └── app.html
├── static/
│   └── favicon.png
├── svelte.config.js               # Use adapter-static for GitHub Pages
└── vite.config.js
```

---

## Step-by-Step Build Instructions

### Phase 1: Project Setup + Map
1. Scaffold a SvelteKit project: `bunx sv create geojson-studio` → choose Skeleton project, TypeScript optional
2. Install dependencies: `bun add maplibre-gl @turf/turf lz-string`
3. In `svelte.config.js`, set `adapter: adapter-static` (for GitHub Pages) or keep default for Vercel
4. Build `Map.svelte`: mount a MapLibre map in `onMount`, expose the map instance via a store (`mapInstance.js`)
5. Add basemap switcher — hardcode 4 style URLs (OSM raster, Carto Light, Carto Dark, a free satellite tiles URL)
6. Verify map renders full-screen with no console errors before moving on

### Phase 2: GeoJSON Input + Rendering
7. Create the `layers` store — an array of objects: `{ id, name, visible, geojson, style }`
8. Build `JsonEditor.svelte` — a `<textarea>` that binds to a local string, has a "Render" button that parses JSON and pushes to the layers store
9. Build file upload in `Toolbar.svelte` — use `<input type="file" accept=".geojson,.json">`, read with `FileReader`, parse, push to layers store
10. In `Map.svelte`, subscribe to the layers store and for each layer call `map.addSource` + `map.addLayer` for fill, line, and circle (point) geometry types — use `feature.geometry.type` to conditionally add the right layer types
11. Handle layer updates reactively: when layers store changes, diff the existing map sources/layers and add/remove/update as needed

### Phase 3: Layer Controls
12. Build `LayerList.svelte` — iterate the layers store, render each with: visibility toggle (eye icon), rename input (double-click), delete button (trash icon)
13. Bind visibility toggle to `map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')`
14. Build `StyleEditor.svelte` — color input for fill, stroke, opacity slider — update MapLibre paint properties on change using `map.setPaintProperty`

### Phase 4: Turf Operations
15. Build `TurfPanel.svelte` with buttons for Buffer, Simplify, Dissolve, Area, Centroid, BBox
16. Each operation: take the currently selected/active layer's GeoJSON, run the Turf function, either replace the layer or add a new derived layer
17. Buffer: show a number input for distance + unit selector (meters/km/miles), call `turf.buffer(geojson, distance, { units })`
18. Simplify: tolerance slider 0–0.1, call `turf.simplify(geojson, { tolerance, highQuality: false })`
19. Area/Length: call `turf.area()` or `turf.length()`, display result in a toast/result bar at the bottom
20. Add a "results" reactive banner at the bottom of the map for non-visual outputs

### Phase 5: Feature Inspection + Export
21. On `map.on('click', layerId, ...)`, get clicked feature properties and show `FeaturePopup.svelte` as a MapLibre `Popup`
22. Format properties as an HTML table inside the popup
23. Export: `JSON.stringify(activeLayer.geojson, null, 2)` → `Blob` → `URL.createObjectURL` → trigger anchor download

### Phase 6: Polish + Deployment
24. Add URL sharing: on any layer update, LZ-compress the GeoJSON and push to `location.hash`; on load, check hash and restore
25. Add dark/light mode toggle via a CSS class on `<body>` controlled by a Svelte store
26. Add coordinate display: `map.on('mousemove', e => { lat = e.lngLat.lat; lng = e.lngLat.lng })` displayed in a fixed bottom bar
27. Deploy to Vercel: `bunx vercel` or connect GitHub repo. For GitHub Pages: `bun run build` → push `build/` folder

---

## Key Svelte Concepts to Use

- **Reactive stores** (`writable`, `derived`) for layers, map instance, and UI state — avoid prop drilling
- **`onMount`** for MapLibre initialization (it's a DOM side-effect, must run client-side only)
- **Reactive declarations** (`$:`) to re-render map layers when the store changes
- **`{#each}` blocks** for the layer list
- **`bind:value`** for the JSON editor textarea and style inputs
- **Slots** for composing Sidebar with different panel content

---

## MapLibre Gotchas

- Always check `map.isStyleLoaded()` or use `map.on('load', ...)` before adding sources/layers
- Use unique IDs for sources and layers — generate with `crypto.randomUUID()`
- To support all geometry types in one GeoJSON, add separate layer entries for `fill`, `line`, and `circle` from the same source, filtered by `['==', ['geometry-type'], 'Polygon']` etc.
- Remove layers before removing sources: `map.removeLayer(id)` then `map.removeSource(id)`

---

## Free Basemap Tile URLs

```js
const BASEMAPS = {
  streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  light:   'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark:    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satellite: 'https://demotiles.maplibre.org/style.json', // swap for real satellite if needed
}
```

---

## Stretch Goals (after the above is working)

- Draw tools (MapLibre Draw plugin) so users can create GeoJSON from scratch on the map
- Attribute table view — spreadsheet-style panel showing all feature properties
- GeoPackage / Shapefile upload (via shpjs library)
- Undo/redo stack using a history array of layer snapshots

---

## Portfolio Presentation Tips

- Host live on Vercel with a vanity URL like `geojson-studio.vercel.app`
- Load a demo GeoJSON on first visit (a world countries file or neighborhood boundaries)
- Add a README with a GIF showing the Buffer and Simplify operations
- Mention Turf.js, MapLibre GL JS, and SvelteKit prominently — these are searchable keywords on LinkedIn

---

## Completion Checklist

- [ ] Map renders with basemap switcher
- [ ] GeoJSON paste → map renders instantly
- [ ] File upload (.geojson) → map renders
- [ ] Layer list with visibility toggle, rename, delete
- [ ] Style editor changes colors on the map live
- [ ] At least 3 Turf operations working (Buffer, Simplify, Area)
- [ ] Feature click popup shows properties
- [ ] Export downloads valid GeoJSON
- [ ] Deployed and publicly accessible
- [ ] README with screenshot and tech stack
