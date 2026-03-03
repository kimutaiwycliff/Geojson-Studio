import * as turf from '@turf/turf';

export function buffer(geojson, distance, units = 'kilometers') {
	return turf.buffer(geojson, Number(distance), { units });
}

export function simplify(geojson, tolerance = 0.001) {
	return turf.simplify(geojson, { tolerance: Number(tolerance), highQuality: false });
}

export function dissolve(geojson) {
	try {
		return turf.dissolve(geojson);
	} catch {
		return geojson;
	}
}

export function calculateArea(geojson) {
	const sqm = turf.area(geojson);
	if (sqm >= 1_000_000) return `${(sqm / 1_000_000).toFixed(4)} km²`;
	if (sqm >= 10_000) return `${(sqm / 10_000).toFixed(4)} ha`;
	return `${sqm.toFixed(2)} m²`;
}

export function calculateLength(geojson) {
	const km = turf.length(geojson, { units: 'kilometers' });
	if (km < 1) return `${(km * 1000).toFixed(1)} m`;
	return `${km.toFixed(4)} km`;
}

export function centroid(geojson) {
	const c = turf.centroid(geojson);
	return turf.featureCollection([c]);
}

export function bboxLayer(geojson) {
	const box = turf.bbox(geojson);
	const poly = turf.bboxPolygon(box);
	return turf.featureCollection([poly]);
}
