<script>
	import { layers, removeLayer, updateLayer } from '$lib/stores/layers.js';
	import { activeLayerId, statusMessage } from '$lib/stores/ui.js';

	let editingId = $state(null);
	let editName = $state('');

	function toggleVisible(layer) {
		updateLayer(layer.id, { visible: !layer.visible });
	}

	function startRename(layer) {
		editingId = layer.id;
		editName = layer.name;
	}

	function commitRename() {
		if (editingId && editName.trim()) {
			updateLayer(editingId, { name: editName.trim() });
		}
		editingId = null;
	}

	function deleteLayer(id) {
		removeLayer(id);
		if ($activeLayerId === id) activeLayerId.set(null);
		statusMessage.set('Layer deleted');
	}

	function selectLayer(id) {
		activeLayerId.set(id);
	}

	function handleRenameKey(e) {
		if (e.key === 'Enter') commitRename();
		if (e.key === 'Escape') editingId = null;
	}
</script>

<div class="layer-list">
	{#if $layers.length === 0}
		<div class="empty-state">
			<p>No layers yet.</p>
			<p>Upload a file or paste GeoJSON in the Editor tab.</p>
		</div>
	{:else}
		{#each [...$layers].reverse() as layer (layer.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="layer-item"
				class:active={$activeLayerId === layer.id}
				onclick={() => selectLayer(layer.id)}
			>
				<div class="layer-swatch" style="background:{layer.style.fillColor}"></div>

				<div class="layer-name" ondblclick={() => startRename(layer)}>
					{#if editingId === layer.id}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="rename-input"
							bind:value={editName}
							onkeydown={handleRenameKey}
							onblur={commitRename}
							autofocus
							onclick={(e) => e.stopPropagation()}
						/>
					{:else}
						<span class="name-text" title={layer.name}>{layer.name}</span>
					{/if}
				</div>

				<div class="layer-actions">
					<button
						class="icon-btn"
						onclick={(e) => { e.stopPropagation(); toggleVisible(layer); }}
						title={layer.visible ? 'Hide layer' : 'Show layer'}
					>
						{#if layer.visible}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
						{/if}
					</button>

					<button
						class="icon-btn danger"
						onclick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
						title="Delete layer"
					>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.layer-list {
		padding: 8px 0;
	}

	.empty-state {
		padding: 24px 16px;
		text-align: center;
		color: var(--text-muted);
		font-size: 13px;
		line-height: 1.6;
	}

	.empty-state p {
		margin: 0 0 4px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		cursor: pointer;
		border-bottom: 1px solid var(--border);
		transition: background 0.1s;
	}

	.layer-item:hover {
		background: var(--surface2);
	}

	.layer-item.active {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-left: 3px solid var(--accent);
		padding-left: 9px;
	}

	.layer-swatch {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.layer-name {
		flex: 1;
		min-width: 0;
	}

	.name-text {
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}

	.rename-input {
		width: 100%;
		font-size: 13px;
		padding: 2px 6px;
		border: 1px solid var(--accent);
		border-radius: 4px;
		background: var(--surface);
		color: var(--text);
		outline: none;
	}

	.layer-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.icon-btn {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		border-radius: 4px;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.1s, color 0.1s;
	}

	.icon-btn:hover {
		background: var(--surface2);
		color: var(--text);
	}

	.icon-btn.danger:hover {
		color: var(--danger);
		background: #fef2f2;
	}
</style>
