<script>
	import { layers, updateLayerStyle } from '$lib/stores/layers.js';
	import { activeLayerId } from '$lib/stores/ui.js';
	import { derived } from 'svelte/store';

	const activeLayer = derived([layers, activeLayerId], ([$layers, $id]) =>
		$layers.find((l) => l.id === $id) ?? null
	);

	function update(key, value) {
		if ($activeLayer) updateLayerStyle($activeLayer.id, { [key]: value });
	}
</script>

{#if $activeLayer}
	<div class="style-editor">
		<div class="section-title">Style — {$activeLayer.name}</div>

		<div class="row">
			<label for="fill-color">Fill color</label>
			<input
				id="fill-color"
				type="color"
				value={$activeLayer.style.fillColor}
				oninput={(e) => update('fillColor', e.target.value)}
			/>
		</div>

		<div class="row">
			<label for="stroke-color">Stroke color</label>
			<input
				id="stroke-color"
				type="color"
				value={$activeLayer.style.strokeColor}
				oninput={(e) => update('strokeColor', e.target.value)}
			/>
		</div>

		<div class="row">
			<label for="opacity">Opacity <span class="val">{$activeLayer.style.opacity.toFixed(2)}</span></label>
			<input
				id="opacity"
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={$activeLayer.style.opacity}
				oninput={(e) => update('opacity', parseFloat(e.target.value))}
			/>
		</div>

		<div class="row">
			<label for="point-radius">Point radius <span class="val">{$activeLayer.style.pointRadius}px</span></label>
			<input
				id="point-radius"
				type="range"
				min="2"
				max="20"
				step="1"
				value={$activeLayer.style.pointRadius}
				oninput={(e) => update('pointRadius', parseInt(e.target.value))}
			/>
		</div>
	</div>
{:else}
	<div class="empty-state">Select a layer to edit its style.</div>
{/if}

<style>
	.style-editor {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	label {
		font-size: 13px;
		color: var(--text);
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.val {
		font-size: 11px;
		color: var(--text-muted);
		font-family: ui-monospace, monospace;
	}

	input[type='range'] {
		flex: 1;
		accent-color: var(--accent);
	}

	input[type='color'] {
		width: 32px;
		height: 28px;
		padding: 2px;
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		background: var(--surface);
	}

	.empty-state {
		padding: 20px 12px;
		color: var(--text-muted);
		font-size: 13px;
		text-align: center;
	}
</style>
