<script>
	import { activeBasemap, darkMode, activeLayerId, statusMessage } from '$lib/stores/ui.js';
	import { layers, addLayer } from '$lib/stores/layers.js';
	import { parseGeoJSON } from '$lib/utils/geojson.js';
	import { downloadGeoJSON } from '$lib/utils/export.js';
	import { encodeToHash } from '$lib/utils/url-share.js';

	const BASEMAP_LABELS = { streets: 'Streets', light: 'Light', dark: 'Dark', satellite: 'Satellite' };

	let error = $state('');

	function handleFileUpload(e) {
		const file = e.target.files[0];
		if (!file) return;
		readFile(file);
		e.target.value = '';
	}

	function handleDrop(e) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file) readFile(file);
	}

	function readFile(file) {
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const geojson = parseGeoJSON(ev.target.result);
				const name = file.name.replace(/\.(geo)?json$/i, '');
				addLayer(geojson, name);
				error = '';
				statusMessage.set(`Loaded "${name}" — ${featureCount(geojson)} features`);
			} catch (err) {
				error = err.message;
			}
		};
		reader.readAsText(file);
	}

	function featureCount(geojson) {
		return geojson.type === 'FeatureCollection' ? geojson.features.length : 1;
	}

	function handleExport() {
		const id = $activeLayerId;
		const layer = $layers.find((l) => l.id === id) ?? $layers.at(-1);
		if (!layer) return;
		downloadGeoJSON(layer.geojson, `${layer.name}.geojson`);
		statusMessage.set(`Exported "${layer.name}"`);
	}

	function handleShare() {
		const id = $activeLayerId;
		const layer = $layers.find((l) => l.id === id) ?? $layers.at(-1);
		if (!layer) return;
		const hash = encodeToHash(layer.geojson);
		history.replaceState(null, '', `#${hash}`);
		navigator.clipboard?.writeText(location.href);
		statusMessage.set('Share URL copied to clipboard');
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	class="toolbar"
	ondragover={(e) => e.preventDefault()}
	ondrop={handleDrop}
>
	<div class="tb-left">
		<span class="logo">⬡ GeoJSON Studio</span>
	</div>

	<div class="tb-center">
		<label class="btn" title="Upload a .geojson or .json file (or drag & drop onto map)">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
			Upload
			<input type="file" accept=".geojson,.json" onchange={handleFileUpload} hidden />
		</label>

		<select bind:value={$activeBasemap} title="Switch basemap">
			{#each Object.entries(BASEMAP_LABELS) as [val, label]}
				<option value={val}>{label}</option>
			{/each}
		</select>
	</div>

	<div class="tb-right">
		{#if error}
			<span class="error-badge" title={error}>⚠ {error}</span>
		{/if}
		<button class="btn" onclick={handleShare} disabled={$layers.length === 0} title="Copy share URL">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
			Share
		</button>
		<button class="btn" onclick={handleExport} disabled={$layers.length === 0} title="Download active layer">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
			Export
		</button>
		<button class="btn icon" onclick={() => darkMode.update((d) => !d)} title="Toggle dark mode">
			{$darkMode ? '☀' : '☽'}
		</button>
	</div>
</header>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: var(--toolbar-h);
		padding: 0 16px;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		z-index: 200;
	}

	.tb-left,
	.tb-center,
	.tb-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tb-right {
		flex: 0 0 auto;
	}

	.logo {
		font-weight: 700;
		font-size: 15px;
		letter-spacing: -0.3px;
		white-space: nowrap;
		color: var(--accent);
	}

	.error-badge {
		font-size: 11px;
		color: var(--danger);
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.btn.icon {
		padding: 5px 9px;
		font-size: 15px;
	}
</style>
