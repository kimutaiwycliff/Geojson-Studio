<script>
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { mapInstance } from '$lib/stores/mapInstance.js';
	import { layers } from '$lib/stores/layers.js';
	import { activeBasemap, mouseCoords } from '$lib/stores/ui.js';

	const BASEMAPS = {
		streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
		light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
		dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
		satellite: 'https://demotiles.maplibre.org/style.json'
	};

	let mapEl;
	let map;
	let mapReady = false;
	let basemapChanging = false;
	let renderedLayerIds = new Set();
	let popup = null;

	onMount(() => {
		map = new maplibregl.Map({
			container: mapEl,
			style: BASEMAPS[get(activeBasemap)] ?? BASEMAPS.streets,
			center: [0, 20],
			zoom: 2,
			attributionControl: { compact: true }
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

		map.on('load', () => {
			mapReady = true;
			mapInstance.set(map);
			syncLayers(get(layers));
		});

		map.on('mousemove', (e) => {
			mouseCoords.set(`${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`);
		});

		map.on('mouseleave', () => mouseCoords.set(''));

		// Subscribe to layers changes
		const unsubLayers = layers.subscribe((currentLayers) => {
			if (mapReady && !basemapChanging) syncLayers(currentLayers);
		});

		// Subscribe to basemap changes
		const unsubBasemap = activeBasemap.subscribe((bm) => {
			if (!mapReady) return; // skip initial call before map loads
			basemapChanging = true;
			renderedLayerIds.clear();
			map.setStyle(BASEMAPS[bm] ?? BASEMAPS.streets);
			map.once('style.load', () => {
				basemapChanging = false;
				syncLayers(get(layers));
			});
		});

		return () => {
			unsubLayers();
			unsubBasemap();
			map?.remove();
			mapInstance.set(null);
		};
	});

	function syncLayers(currentLayers) {
		if (!map || !mapReady) return;

		const currentIds = new Set(currentLayers.map((l) => l.id));

		// Remove stale layers
		for (const id of renderedLayerIds) {
			if (!currentIds.has(id)) {
				safeRemoveLayer(id);
				renderedLayerIds.delete(id);
			}
		}

		// Add new or update existing
		for (const layer of currentLayers) {
			if (renderedLayerIds.has(layer.id)) {
				updateMapLayer(layer);
			} else {
				addMapLayer(layer);
				renderedLayerIds.add(layer.id);
			}
		}
	}

	function addMapLayer(layer) {
		if (map.getSource(layer.id)) return;

		map.addSource(layer.id, { type: 'geojson', data: layer.geojson });

		// Fill — polygons
		map.addLayer({
			id: `${layer.id}-fill`,
			type: 'fill',
			source: layer.id,
			filter: ['==', ['geometry-type'], 'Polygon'],
			paint: {
				'fill-color': layer.style.fillColor,
				'fill-opacity': layer.style.opacity * 0.55
			},
			layout: { visibility: layer.visible ? 'visible' : 'none' }
		});

		// Line — polygons + linestrings
		map.addLayer({
			id: `${layer.id}-line`,
			type: 'line',
			source: layer.id,
			filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'LineString']]],
			paint: {
				'line-color': layer.style.strokeColor,
				'line-width': 2,
				'line-opacity': layer.style.opacity
			},
			layout: { visibility: layer.visible ? 'visible' : 'none' }
		});

		// Circle — points
		map.addLayer({
			id: `${layer.id}-circle`,
			type: 'circle',
			source: layer.id,
			filter: ['==', ['geometry-type'], 'Point'],
			paint: {
				'circle-color': layer.style.fillColor,
				'circle-radius': layer.style.pointRadius,
				'circle-stroke-color': layer.style.strokeColor,
				'circle-stroke-width': 1.5,
				'circle-opacity': layer.style.opacity
			},
			layout: { visibility: layer.visible ? 'visible' : 'none' }
		});

		// Click handlers for all sub-layers
		for (const suffix of ['-fill', '-line', '-circle']) {
			const lid = `${layer.id}${suffix}`;
			map.on('click', lid, (e) => {
				if (!e.features?.length) return;
				showPopup(e.lngLat, e.features[0].properties);
			});
			map.on('mouseenter', lid, () => (map.getCanvas().style.cursor = 'pointer'));
			map.on('mouseleave', lid, () => (map.getCanvas().style.cursor = ''));
		}

		// Fit bounds on first add
		try {
			const bounds = computeBounds(layer.geojson);
			if (bounds) map.fitBounds(bounds, { padding: 60, maxZoom: 14, animate: true });
		} catch {
			/* ignore bad geometries */
		}
	}

	function updateMapLayer(layer) {
		const src = map.getSource(layer.id);
		if (!src) return;
		src.setData(layer.geojson);

		const vis = layer.visible ? 'visible' : 'none';
		const fillId = `${layer.id}-fill`;
		const lineId = `${layer.id}-line`;
		const circId = `${layer.id}-circle`;

		if (map.getLayer(fillId)) {
			map.setLayoutProperty(fillId, 'visibility', vis);
			map.setPaintProperty(fillId, 'fill-color', layer.style.fillColor);
			map.setPaintProperty(fillId, 'fill-opacity', layer.style.opacity * 0.55);
		}
		if (map.getLayer(lineId)) {
			map.setLayoutProperty(lineId, 'visibility', vis);
			map.setPaintProperty(lineId, 'line-color', layer.style.strokeColor);
			map.setPaintProperty(lineId, 'line-opacity', layer.style.opacity);
		}
		if (map.getLayer(circId)) {
			map.setLayoutProperty(circId, 'visibility', vis);
			map.setPaintProperty(circId, 'circle-color', layer.style.fillColor);
			map.setPaintProperty(circId, 'circle-radius', layer.style.pointRadius);
			map.setPaintProperty(circId, 'circle-stroke-color', layer.style.strokeColor);
			map.setPaintProperty(circId, 'circle-opacity', layer.style.opacity);
		}
	}

	function safeRemoveLayer(id) {
		for (const suffix of ['-fill', '-line', '-circle']) {
			const lid = `${id}${suffix}`;
			if (map.getLayer(lid)) map.removeLayer(lid);
		}
		if (map.getSource(id)) map.removeSource(id);
	}

	function showPopup(lngLat, properties) {
		if (popup) popup.remove();

		const keys = Object.keys(properties ?? {});
		let html;
		if (keys.length === 0) {
			html = '<div class="gs-empty">No properties</div>';
		} else {
			const rows = keys
				.map(
					(k) =>
						`<tr><th>${esc(k)}</th><td>${esc(String(properties[k] ?? ''))}</td></tr>`
				)
				.join('');
			html = `<div class="gs-scroll"><table class="gs-tbl">${rows}</table></div>`;
		}

		popup = new maplibregl.Popup({ maxWidth: '320px', className: 'gs-popup' })
			.setLngLat(lngLat)
			.setHTML(html)
			.addTo(map);
	}

	function esc(s) {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function computeBounds(geojson) {
		const bounds = new maplibregl.LngLatBounds();
		let count = 0;

		function walkCoords(coords) {
			if (!Array.isArray(coords) || coords.length === 0) return;
			if (typeof coords[0] === 'number') {
				bounds.extend([coords[0], coords[1]]);
				count++;
			} else {
				coords.forEach(walkCoords);
			}
		}

		function walkGeom(geom) {
			if (!geom) return;
			if (geom.type === 'GeometryCollection') geom.geometries?.forEach(walkGeom);
			else walkCoords(geom.coordinates);
		}

		if (geojson.type === 'FeatureCollection') geojson.features?.forEach((f) => walkGeom(f.geometry));
		else if (geojson.type === 'Feature') walkGeom(geojson.geometry);
		else walkGeom(geojson);

		return count > 0 ? bounds : null;
	}
</script>

<div bind:this={mapEl} class="map-wrap"></div>

<style>
	.map-wrap {
		position: absolute;
		inset: 0;
	}

	/* Popup styles injected globally */
	:global(.gs-popup .maplibregl-popup-content) {
		padding: 10px 12px;
		border-radius: 8px;
		font-family: ui-monospace, 'Cascadia Code', monospace;
		font-size: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}
	:global(.gs-scroll) {
		max-height: 220px;
		overflow-y: auto;
	}
	:global(.gs-tbl) {
		border-collapse: collapse;
		width: 100%;
	}
	:global(.gs-tbl th) {
		text-align: left;
		padding: 2px 10px 2px 0;
		font-weight: 600;
		color: #64748b;
		white-space: nowrap;
		vertical-align: top;
	}
	:global(.gs-tbl td) {
		padding: 2px 0;
		word-break: break-all;
		vertical-align: top;
	}
	:global(.gs-empty) {
		color: #94a3b8;
		font-style: italic;
	}
</style>
