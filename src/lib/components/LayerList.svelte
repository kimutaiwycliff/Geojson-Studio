<script lang="ts">
	import { layers, removeLayer, updateLayer } from '$lib/stores/layers.js';
	import { activeLayerId, statusMessage } from '$lib/stores/ui.js';
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
				onclick={() => activeLayerId.set(layer.id)}
			>
				<div
					class="size-3 shrink-0 rounded-[3px] border border-black/10"
					style="background:{layer.style.fillColor}"
				></div>

				<div class="min-w-0 flex-1" ondblclick={() => startRename(layer)}>
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
