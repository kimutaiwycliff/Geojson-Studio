<script lang="ts">
	import { get } from 'svelte/store';
	import { layers, removeLayer, updateLayer } from '$lib/stores/layers.js';
	import { activeLayerId, statusMessage } from '$lib/stores/ui.js';
	import { mapInstance } from '$lib/stores/mapInstance.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let editingId = $state<string | null>(null);
	let editName = $state('');

	function toggleVisible(layer: any) { updateLayer(layer.id, { visible: !layer.visible }); }

	function startRename(layer: any) { editingId = layer.id; editName = layer.name; }

	function commitRename() {
		if (editingId && editName.trim()) updateLayer(editingId, { name: editName.trim() });
		editingId = null;
	}

	function deleteLayer(id: string) {
		removeLayer(id);
		if ($activeLayerId === id) activeLayerId.set(null);
		statusMessage.set('Layer deleted');
	}

	function handleRenameKey(e: KeyboardEvent) {
		if (e.key === 'Enter') commitRename();
		if (e.key === 'Escape') editingId = null;
	}

	function getBounds(geojson: any): [[number, number], [number, number]] | null {
		let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
		let count = 0;

		function walkCoords(coords: any) {
			if (!Array.isArray(coords) || coords.length === 0) return;
			if (typeof coords[0] === 'number') {
				minLng = Math.min(minLng, coords[0]); maxLng = Math.max(maxLng, coords[0]);
				minLat = Math.min(minLat, coords[1]); maxLat = Math.max(maxLat, coords[1]);
				count++;
			} else {
				coords.forEach(walkCoords);
			}
		}

		function walkGeom(geom: any) {
			if (!geom) return;
			if (geom.type === 'GeometryCollection') geom.geometries?.forEach(walkGeom);
			else walkCoords(geom.coordinates);
		}

		if (geojson?.type === 'FeatureCollection') geojson.features?.forEach((f: any) => walkGeom(f.geometry));
		else if (geojson?.type === 'Feature') walkGeom(geojson.geometry);
		else walkGeom(geojson);

		return count > 0 ? [[minLng, minLat], [maxLng, maxLat]] : null;
	}

	function selectAndFly(layer: any) {
		activeLayerId.set(layer.id);
		const map = get(mapInstance);
		if (!map) return;
		const bounds = getBounds(layer.geojson);
		if (!bounds) return;
		map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 800 });
	}
</script>

<div class="py-1">
	{#if $layers.length === 0}
		<div class="px-4 py-6 text-center text-xs text-muted-foreground leading-relaxed">
			<p>No layers yet.</p>
			<p>Upload a file or paste GeoJSON in the Editor tab.</p>
		</div>
	{:else}
		{#each [...$layers].reverse() as layer (layer.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex items-center gap-2 border-b px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50
					{$activeLayerId === layer.id ? 'border-l-2 border-l-primary bg-primary/5 pl-[10px]' : ''}"
				onclick={() => selectAndFly(layer)}
			>
				<div
					class="size-3 shrink-0 rounded-[3px] border border-black/10"
					style="background:{layer.style.fillColor}"
				></div>

				<div class="min-w-0 flex-1">
					{#if editingId === layer.id}
						<!-- svelte-ignore a11y_autofocus -->
						<Input
							class="h-6 px-1.5 text-xs font-mono"
							bind:value={editName}
							onkeydown={handleRenameKey}
							onblur={commitRename}
							autofocus
							onclick={(e: MouseEvent) => e.stopPropagation()}
						/>
					{:else}
						<span class="block truncate text-xs" title={layer.name}>{layer.name}</span>
					{/if}
				</div>

				<div class="flex shrink-0 items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						class="size-7 text-muted-foreground"
						onclick={(e: MouseEvent) => { e.stopPropagation(); startRename(layer); }}
						title="Rename layer"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						class="size-7 text-muted-foreground"
						onclick={(e: MouseEvent) => { e.stopPropagation(); toggleVisible(layer); }}
						title={layer.visible ? 'Hide layer' : 'Show layer'}
					>
						{#if layer.visible}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
						{:else}
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
						{/if}
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						class="size-7 text-muted-foreground hover:text-destructive"
						onclick={(e: MouseEvent) => { e.stopPropagation(); deleteLayer(layer.id); }}
						title="Delete layer"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
					</Button>
				</div>
			</div>
		{/each}
	{/if}
</div>
