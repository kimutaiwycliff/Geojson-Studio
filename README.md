# GeoJSON Studio

> A fast, browser-based GeoJSON editor and map visualizer — no account, no API key, no backend.

**[Live Demo →](https://geojson-studio.vercel.app)**

![GeoJSON Studio screenshot](https://via.placeholder.com/1200x630/1e293b/60a5fa?text=GeoJSON+Studio)

---

## What it does

GeoJSON Studio lets you load, inspect, edit, and transform GeoJSON data right in your browser. Think of it as a lightweight, open-source alternative to [geojson.io](https://geojson.io) — but with built-in geometry operations powered by Turf.js.

Upload a file, paste raw JSON, or share a link — your data renders on a live map instantly.

---

## Features

### Core
| Feature | Description |
|---|---|
| **Map canvas** | Full-screen WebGL map (MapLibre GL JS) with 4 basemaps: Streets, Light, Dark, Satellite |
| **GeoJSON paste** | Code editor panel — paste any valid GeoJSON and hit Render (`⌘↵`) |
| **File upload** | Drag & drop or click-to-upload `.geojson` / `.json` files |
| **Live rendering** | Polygons, lines, and points all render instantly with auto-fitted bounds |
| **Multi-layer** | Load multiple files as separate named layers |
| **Feature popup** | Click any feature to inspect all its properties in a clean table |
| **Export** | Download the active layer as a `.geojson` file |

### Layer Controls
- Toggle layer visibility (eye icon)
- Double-click to rename a layer inline
- Delete layers individually
- Select active layer for editing and operations

### Style Editor
- Fill color picker per layer
- Stroke/outline color picker
- Opacity slider (0 → 1)
- Point radius slider (2 → 20 px)
- All style changes reflect on the map live

### Geometry Operations (Turf.js)
| Operation | What it does |
|---|---|
| **Buffer** | Expand or shrink geometry by a distance (m / km / mi) |
| **Simplify** | Reduce vertex count with a tolerance slider |
| **Dissolve** | Merge all polygon features into one |
| **Area** | Calculate total area in m², ha, or km² |
| **Length** | Measure total line length in m or km |
| **Centroid** | Add centroid point(s) as a new layer |
| **BBox** | Add the bounding box rectangle as a new layer |

### Polish
- Dark / Light mode toggle
- Live lat/lng coordinate display on mouse hover
- Share button — compresses the active layer into the URL hash (LZ-string), copies link to clipboard
- Restore from shared URL on page load
- Collapsible sidebar

---

## Tech Stack

| | |
|---|---|
| [SvelteKit 5](https://kit.svelte.dev) | App framework (runes mode, SSR-off) |
| [MapLibre GL JS 5](https://maplibre.org) | Open-source WebGL map renderer |
| [Turf.js 7](https://turfjs.org) | Client-side geospatial operations |
| [LZ-String](https://github.com/pieroxy/lz-string) | URL compression for shareable links |
| [Bun](https://bun.sh) | Package manager & runtime |

Zero backend. Zero API keys. Runs entirely client-side.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/geojson-studio.git
cd geojson-studio

# Install dependencies
bun install

# Start dev server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Production build
bun run build

# Preview the build
bun run preview
```

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main app layout + dark mode + hash restore
│   └── +layout.svelte        # Global CSS import
├── lib/
│   ├── components/
│   │   ├── Map.svelte         # MapLibre wrapper — layer sync, popups, coordinates
│   │   ├── Toolbar.svelte     # Upload, basemap switcher, export, share, dark mode
│   │   ├── Sidebar.svelte     # Tabbed panel (Editor | Layers | Turf)
│   │   ├── LayerList.svelte   # Layer list with visibility, rename, delete
│   │   ├── StyleEditor.svelte # Per-layer color + opacity controls
│   │   ├── JsonEditor.svelte  # GeoJSON paste editor
│   │   └── TurfPanel.svelte   # Geometry operation buttons
│   ├── stores/
│   │   ├── layers.js          # Writable store — all loaded layers
│   │   ├── mapInstance.js     # MapLibre map ref
│   │   └── ui.js              # Sidebar, dark mode, active layer, basemap, coords
│   └── utils/
│       ├── geojson.js         # Parse & normalize GeoJSON (→ FeatureCollection)
│       ├── turf-ops.js        # Turf.js operation wrappers
│       ├── export.js          # Blob download helper
│       └── url-share.js       # LZ-string encode/decode for URL sharing
└── app.css                    # CSS custom properties (light + dark theme)
```

---

## Deployment

**Vercel (recommended)**

```bash
bunx vercel
```

Or connect your GitHub repo to Vercel — it detects SvelteKit automatically.

**GitHub Pages**

Switch the adapter in `svelte.config.js` to `@sveltejs/adapter-static`, then push the `build/` output.

---

## Roadmap

- [ ] Draw tools — create GeoJSON from scratch on the map (MapLibre Draw)
- [ ] Attribute table — spreadsheet view of all feature properties
- [ ] Shapefile / GeoPackage upload (via `shpjs`)
- [ ] Undo / redo history stack
- [ ] Color-by-attribute — choropleth styling based on a property value

---

## License

MIT
