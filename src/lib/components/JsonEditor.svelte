<script lang="ts">
	import { addLayer } from '$lib/stores/layers.js';
	import { parseGeoJSON, validateGeoJSON } from '$lib/utils/geojson.js';
	import { statusMessage } from '$lib/stores/ui.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let text = $state('');
	let error = $state('');
	let validMsg = $state('');

	const DEMO = JSON.stringify({
		type: 'FeatureCollection',
		features: [
			{ type: 'Feature', geometry: { type: 'Point', coordinates: [-74.006, 40.7128] }, properties: { name: 'New York City', pop: 8336817 } },
			{ type: 'Feature', geometry: { type: 'Point', coordinates: [-118.2437, 34.0522] }, properties: { name: 'Los Angeles', pop: 3979576 } },
			{ type: 'Feature', geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] }, properties: { name: 'Chicago', pop: 2693976 } }
		]
	}, null, 2);

	function handleRender() {
		if (!text.trim()) return;
		error = ''; validMsg = '';
		try {
			const geojson = parseGeoJSON(text);
			const count = geojson.type === 'FeatureCollection' ? geojson.features.length : 1;
			addLayer(geojson, 'Pasted GeoJSON');
			text = '';
			statusMessage.set(`Rendered ${count} feature${count !== 1 ? 's' : ''}`);
		} catch (e: any) { error = e.message; }
	}

	function handleValidate() {
		if (!text.trim()) return;
		const result = validateGeoJSON(text);
		if (result.valid) { error = ''; validMsg = '✓ Valid GeoJSON'; }
		else { validMsg = ''; error = result.error ?? ''; }
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRender(); }
	}
</script>

<div class="flex h-full flex-col gap-3 p-3">
	<div class="flex items-center justify-between">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paste GeoJSON</p>
		<Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={() => { text = DEMO; error = ''; validMsg = ''; }}>
			load demo
		</Button>
	</div>

	<Textarea
		bind:value={text}
		onkeydown={handleKeydown}
		placeholder={'Paste GeoJSON here...\n\n{\n  "type": "FeatureCollection",\n  "features": [...]\n}'}
		spellcheck={false}
		class="min-h-[180px] flex-1 resize-none font-mono text-xs leading-relaxed"
	/>

	{#if error}
		<Badge variant="destructive" class="justify-start text-wrap py-1.5 font-normal">⚠ {error}</Badge>
	{/if}
	{#if validMsg}
		<Badge class="justify-start bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal">{validMsg}</Badge>
	{/if}

	<div class="flex justify-end gap-2">
		<Button variant="outline" size="sm" onclick={handleValidate} disabled={!text.trim()}>Validate</Button>
		<Button size="sm" onclick={handleRender} disabled={!text.trim()}>Render ⌘↵</Button>
	</div>
</div>
