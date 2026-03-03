import pkg from 'lz-string';
const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = pkg;

export function encodeToHash(geojson) {
	return compressToEncodedURIComponent(JSON.stringify(geojson));
}

export function decodeFromHash(hash) {
	try {
		const str = decompressFromEncodedURIComponent(hash);
		if (!str) return null;
		return JSON.parse(str);
	} catch {
		return null;
	}
}
