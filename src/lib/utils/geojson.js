const GEOMETRY_TYPES = [
	'Point',
	'MultiPoint',
	'LineString',
	'MultiLineString',
	'Polygon',
	'MultiPolygon',
	'GeometryCollection'
];

export function parseGeoJSON(text) {
	const data = JSON.parse(text); // throws SyntaxError on bad JSON
	if (!data || typeof data !== 'object' || !data.type) {
		throw new Error('Missing or invalid "type" field');
	}
	if (data.type === 'Feature') {
		return { type: 'FeatureCollection', features: [data] };
	}
	if (data.type === 'FeatureCollection') {
		return data;
	}
	if (GEOMETRY_TYPES.includes(data.type)) {
		return {
			type: 'FeatureCollection',
			features: [{ type: 'Feature', geometry: data, properties: {} }]
		};
	}
	throw new Error(`Unknown GeoJSON type: "${data.type}"`);
}

export function validateGeoJSON(text) {
	try {
		parseGeoJSON(text);
		return { valid: true, error: null };
	} catch (e) {
		return { valid: false, error: e.message };
	}
}
