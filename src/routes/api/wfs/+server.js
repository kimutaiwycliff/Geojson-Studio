import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	const {
		baseUrl,
		typename,
		cqlFilter,
		srsname = 'EPSG:4326',
		version = '2.0.0',
		customHeaders = {}
	} = body;

	if (!baseUrl?.trim() || !typename?.trim()) {
		throw error(400, 'baseUrl and typename are required');
	}

	const params = new URLSearchParams({
		service: 'WFS',
		version,
		request: 'GetFeature',
		typename: typename.trim(),
		outputFormat: 'application/json',
		srsname
	});

	if (cqlFilter?.trim()) {
		params.set('cql_filter', cqlFilter.trim());
	}

	const url = `${baseUrl.trim()}?${params}`;

	let res;
	try {
		res = await fetch(url, {
			headers: {
				Accept: 'application/json',
				...customHeaders
			}
		});
	} catch (err) {
		throw error(502, `Could not reach GeoServer: ${err.message}`);
	}

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw error(res.status, `GeoServer responded ${res.status}: ${text.slice(0, 300)}`);
	}

	let geojson;
	try {
		geojson = await res.json();
	} catch {
		throw error(502, 'GeoServer did not return valid JSON');
	}

	return json(geojson);
}
