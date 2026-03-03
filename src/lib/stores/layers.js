import { writable } from 'svelte/store';

export const layers = writable([]);

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
let colorIndex = 0;

export function addLayer(geojson, name) {
	const id = crypto.randomUUID();
	const color = COLORS[colorIndex % COLORS.length];
	colorIndex++;
	layers.update((ls) => [
		...ls,
		{
			id,
			name: name || `Layer ${ls.length + 1}`,
			visible: true,
			geojson,
			style: {
				fillColor: color,
				strokeColor: darken(color),
				opacity: 0.7,
				pointRadius: 6
			}
		}
	]);
	return id;
}

export function removeLayer(id) {
	layers.update((ls) => ls.filter((l) => l.id !== id));
}

export function updateLayer(id, updates) {
	layers.update((ls) => ls.map((l) => (l.id === id ? { ...l, ...updates } : l)));
}

export function updateLayerStyle(id, styleUpdates) {
	layers.update((ls) =>
		ls.map((l) => (l.id === id ? { ...l, style: { ...l.style, ...styleUpdates } } : l))
	);
}

function darken(hex) {
	const n = parseInt(hex.slice(1), 16);
	const r = Math.max(0, (n >> 16) - 40);
	const g = Math.max(0, ((n >> 8) & 0xff) - 40);
	const b = Math.max(0, (n & 0xff) - 40);
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
