export function downloadGeoJSON(geojson, filename = 'export.geojson') {
	const str = JSON.stringify(geojson, null, 2);
	const blob = new Blob([str], { type: 'application/geo+json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
