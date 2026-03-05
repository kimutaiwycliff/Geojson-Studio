<script lang="ts">
	import { get } from 'svelte/store';
	import { mapInstance } from '$lib/stores/mapInstance.js';
	import { statusMessage } from '$lib/stores/ui.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let baseUrl = $state('');
	let sourceId = $state('');
	let sourceLayer = $state('');
	let fillColor = $state('#3b82f6');
	let strokeColor = $state('#1d4ed8');
	let catalogLoading = $state(false);
	let addLoading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');
	let showStyle = $state(false);

	let catalog: string[] = $state([]);
	let martinLayers: { id: string; label: string }[] = $state([]);

	// Derive source-layer name: strip schema prefix (e.g. "public.parcels" → "parcels")
	let derivedSourceLayer = $derived(sourceLayer.trim() || sourceId.trim().split('.').pop() || '');

	async function fetchCatalog() {
		errorMsg = '';
		successMsg = '';
		if (!baseUrl.trim()) {
			errorMsg = 'Base URL is required.';
			return;
		}
		catalogLoading = true;
		try {
			const res = await fetch(`${baseUrl.trim().replace(/\/$/, '')}/catalog`);
			if (!res.ok) {
				errorMsg = `Catalog request failed: HTTP ${res.status}`;
				return;
			}
			const data = await res.json();
			// Martin catalog shape: { tiles: { "source_id": {...} } }
			catalog = Object.keys(data?.tiles ?? {});
			if (catalog.length === 0) errorMsg = 'No tile sources found in catalog.';
		} catch (e: any) {
			errorMsg = `Cannot reach Martin: ${e.message}`;
		} finally {
			catalogLoading = false;
		}
	}

	function selectSource(id: string) {
		sourceId = id;
		sourceLayer = '';
	}

	function addMartinLayer() {
		errorMsg = '';
		successMsg = '';
		const map = get(mapInstance);
		if (!map) { errorMsg = 'Map not ready.'; return; }
		if (!baseUrl.trim() || !sourceId.trim()) {
			errorMsg = 'Base URL and source ID are required.';
			return;
		}

		const uid = `martin-${Date.now()}`;
		const tileUrl = `${baseUrl.trim().replace(/\/$/, '')}/${sourceId.trim()}/{z}/{x}/{y}.pbf`;
		const sl = derivedSourceLayer || sourceId.trim();
		const label = sourceId.trim().split('.').pop() ?? sourceId.trim();

		addLoading = true;
		try {
			map.addSource(uid, {
				type: 'vector',
				tiles: [tileUrl],
				minzoom: 0,
				maxzoom: 22
			});

			map.addLayer({
				id: `${uid}-fill`,
				type: 'fill',
				source: uid,
				'source-layer': sl,
				filter: ['==', ['geometry-type'], 'Polygon'],
				paint: { 'fill-color': fillColor, 'fill-opacity': 0.4 }
			});

			map.addLayer({
				id: `${uid}-line`,
				type: 'line',
				source: uid,
				'source-layer': sl,
				filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'LineString']]],
				paint: { 'line-color': strokeColor, 'line-width': 1.5 }
			});

			map.addLayer({
				id: `${uid}-circle`,
				type: 'circle',
				source: uid,
				'source-layer': sl,
				filter: ['==', ['geometry-type'], 'Point'],
				paint: {
					'circle-color': fillColor,
					'circle-radius': 5,
					'circle-stroke-color': strokeColor,
					'circle-stroke-width': 1.5
				}
			});

			martinLayers = [...martinLayers, { id: uid, label }];
			successMsg = `✓ Layer "${label}" added`;
			statusMessage.set(`Martin layer added: ${label}`);
		} catch (e: any) {
			errorMsg = e.message;
		} finally {
			addLoading = false;
		}
	}

	function removeMartinLayer(uid: string) {
		const map = get(mapInstance);
		if (!map) return;
		for (const suffix of ['-fill', '-line', '-circle']) {
			const lid = `${uid}${suffix}`;
			if (map.getLayer(lid)) map.removeLayer(lid);
		}
		if (map.getSource(uid)) map.removeSource(uid);
		martinLayers = martinLayers.filter((l) => l.id !== uid);
	}
</script>

<div class="flex flex-col gap-2 p-3">

	<!-- What is Martin? -->
	<section class="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-1 dark:border-blue-900/40 dark:bg-blue-950/20">
		<p class="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Martin — Vector Tile Server</p>
		<p class="text-[10px] text-muted-foreground leading-relaxed">
			Martin serves PostGIS tables as MapLibre-native <strong>vector tiles</strong> (MVT). Unlike WFS, tiles are rendered by the GPU and only load data in the current viewport — ideal for large datasets.
		</p>
	</section>

	<!-- Connection -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>
		<div class="space-y-1.5">
			<label for="martin-url" class="text-[11px] text-muted-foreground">Martin Base URL</label>
			<Input
				id="martin-url"
				bind:value={baseUrl}
				placeholder="http://localhost:3000"
				class="h-7 text-xs font-mono"
			/>
		</div>
		<Button
			variant="outline"
			size="sm"
			class="w-full h-7 text-xs"
			onclick={fetchCatalog}
			disabled={catalogLoading || !baseUrl.trim()}
		>
			{#if catalogLoading}
				<svg class="mr-1.5 animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M21 12a9 9 0 1 1-6.219-8.56" />
				</svg>
				Loading catalog…
			{:else}
				Browse catalog
			{/if}
		</Button>
	</section>

	<!-- Catalog / Source picker -->
	{#if catalog.length > 0}
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
				Sources <span class="font-normal normal-case">({catalog.length})</span>
			</p>
			<div class="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
				{#each catalog as id}
					<button
						class="w-full truncate rounded px-2 py-1 text-left text-[11px] font-mono transition-colors
							{sourceId === id
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-muted text-muted-foreground hover:text-foreground'}"
						onclick={() => selectSource(id)}
					>
						{id}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Source ID (manual or populated from catalog) -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
		<div class="space-y-1.5">
			<label for="martin-source" class="text-[11px] text-muted-foreground">Source ID</label>
			<Input
				id="martin-source"
				bind:value={sourceId}
				placeholder="public.parcels"
				class="h-7 text-xs font-mono"
			/>
			<p class="text-[10px] text-muted-foreground">Tile URL: <span class="font-mono">{baseUrl.trim() || 'http://…'}/{sourceId.trim() || 'source'}/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.pbf</span></p>
		</div>
		<div class="space-y-1.5">
			<label for="martin-sl" class="text-[11px] text-muted-foreground">
				Source layer <span class="font-normal">(auto-derived if blank)</span>
			</label>
			<Input
				id="martin-sl"
				bind:value={sourceLayer}
				placeholder={derivedSourceLayer || 'auto'}
				class="h-7 text-xs font-mono"
			/>
		</div>
	</section>

	<!-- Style -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<button
			class="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
			onclick={() => (showStyle = !showStyle)}
		>
			<span>Style</span>
			<svg
				width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2.5"
				class="transition-transform {showStyle ? 'rotate-180' : ''}"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>

		{#if showStyle}
			<div class="flex gap-4">
				<div class="space-y-1">
					<label for="martin-fill" class="text-[10px] text-muted-foreground">Fill</label>
					<input id="martin-fill" type="color" bind:value={fillColor} class="h-7 w-12 cursor-pointer rounded border p-0.5" />
				</div>
				<div class="space-y-1">
					<label for="martin-stroke" class="text-[10px] text-muted-foreground">Stroke</label>
					<input id="martin-stroke" type="color" bind:value={strokeColor} class="h-7 w-12 cursor-pointer rounded border p-0.5" />
				</div>
			</div>
		{/if}
	</section>

	<!-- Basemap warning -->
	<p class="text-[10px] text-muted-foreground px-0.5">
		⚠ Switching basemaps removes Martin layers. Re-add them from this panel.
	</p>

	{#if errorMsg}
		<Badge variant="destructive" class="justify-start text-wrap py-1.5 font-normal text-xs">⚠ {errorMsg}</Badge>
	{/if}
	{#if successMsg}
		<Badge class="justify-start bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-xs">{successMsg}</Badge>
	{/if}

	<Button
		size="sm"
		class="w-full"
		onclick={addMartinLayer}
		disabled={addLoading || !baseUrl.trim() || !sourceId.trim()}
	>
		Add to Map
	</Button>

	<!-- Active Martin layers -->
	{#if martinLayers.length > 0}
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Layers</p>
			{#each martinLayers as layer}
				<div class="flex items-center justify-between gap-2">
					<span class="truncate text-xs font-mono text-foreground">{layer.label}</span>
					<button
						onclick={() => removeMartinLayer(layer.id)}
						class="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
						title="Remove layer"
					>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			{/each}
		</section>
	{/if}

</div>
