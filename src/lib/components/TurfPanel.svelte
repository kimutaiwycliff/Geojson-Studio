<script>
	import { layers, addLayer, updateLayer } from '$lib/stores/layers.js';
	import { activeLayerId, statusMessage } from '$lib/stores/ui.js';
	import { derived } from 'svelte/store';
	import * as turfOps from '$lib/utils/turf-ops.js';

	const activeLayer = derived([layers, activeLayerId], ([$layers, $id]) =>
		$layers.find((l) => l.id === $id) ?? null
	);

	// Buffer settings
	let bufferDist = $state(10);
	let bufferUnit = $state('kilometers');

	// Simplify settings
	let simplifyTol = $state(0.005);

	// Result message
	let result = $state('');
	let resultError = $state('');

	function run(fn, addAsNew = true, resultKey = null) {
		if (!$activeLayer) return;
		result = '';
		resultError = '';
		try {
			const output = fn($activeLayer.geojson);
			if (resultKey) {
				result = output;
				return;
			}
			if (addAsNew) {
				addLayer(output, `${$activeLayer.name} (${fn.name})`);
				statusMessage.set(`Created derived layer from "${$activeLayer.name}"`);
			} else {
				updateLayer($activeLayer.id, { geojson: output });
				statusMessage.set(`Updated "${$activeLayer.name}"`);
			}
		} catch (e) {
			resultError = e.message;
		}
	}

	function runBuffer() {
		if (!$activeLayer) return;
		result = '';
		resultError = '';
		try {
			const out = turfOps.buffer($activeLayer.geojson, bufferDist, bufferUnit);
			addLayer(out, `${$activeLayer.name} buffer ${bufferDist}${bufferUnit[0]}`);
			statusMessage.set(`Buffered "${$activeLayer.name}" by ${bufferDist} ${bufferUnit}`);
		} catch (e) {
			resultError = e.message;
		}
	}

	function runSimplify() {
		if (!$activeLayer) return;
		result = '';
		resultError = '';
		try {
			const out = turfOps.simplify($activeLayer.geojson, simplifyTol);
			updateLayer($activeLayer.id, { geojson: out });
			statusMessage.set(`Simplified "${$activeLayer.name}" (tolerance: ${simplifyTol})`);
		} catch (e) {
			resultError = e.message;
		}
	}

	function runDissolve() {
		run(() => turfOps.dissolve($activeLayer.geojson), true);
	}

	function runArea() {
		if (!$activeLayer) return;
		resultError = '';
		try {
			result = `Area: ${turfOps.calculateArea($activeLayer.geojson)}`;
		} catch (e) {
			resultError = e.message;
		}
	}

	function runLength() {
		if (!$activeLayer) return;
		resultError = '';
		try {
			result = `Length: ${turfOps.calculateLength($activeLayer.geojson)}`;
		} catch (e) {
			resultError = e.message;
		}
	}

	function runCentroid() {
		if (!$activeLayer) return;
		resultError = '';
		try {
			const out = turfOps.centroid($activeLayer.geojson);
			addLayer(out, `${$activeLayer.name} centroid`);
			statusMessage.set('Centroid added as new layer');
		} catch (e) {
			resultError = e.message;
		}
	}

	function runBBox() {
		if (!$activeLayer) return;
		resultError = '';
		try {
			const out = turfOps.bboxLayer($activeLayer.geojson);
			addLayer(out, `${$activeLayer.name} bbox`);
			statusMessage.set('Bounding box added as new layer');
		} catch (e) {
			resultError = e.message;
		}
	}
</script>

<div class="turf-panel">
	{#if !$activeLayer}
		<div class="empty-state">Select a layer in the Layers tab to run operations on it.</div>
	{:else}
		<div class="active-label">
			Operating on: <strong>{$activeLayer.name}</strong>
		</div>

		{#if result}
			<div class="result-banner">{result}</div>
		{/if}
		{#if resultError}
			<div class="error-banner">⚠ {resultError}</div>
		{/if}

		<!-- Buffer -->
		<section class="op-section">
			<div class="op-header">Buffer</div>
			<div class="op-controls">
				<input
					type="number"
					bind:value={bufferDist}
					min="0"
					step="1"
					class="num-input"
					aria-label="Buffer distance"
				/>
				<select bind:value={bufferUnit}>
					<option value="meters">m</option>
					<option value="kilometers">km</option>
					<option value="miles">mi</option>
				</select>
				<button class="op-btn" onclick={runBuffer}>Apply</button>
			</div>
		</section>

		<!-- Simplify -->
		<section class="op-section">
			<div class="op-header">
				Simplify
				<span class="tol-val">tolerance: {simplifyTol}</span>
			</div>
			<div class="op-controls">
				<input
					type="range"
					min="0.0001"
					max="0.1"
					step="0.0001"
					bind:value={simplifyTol}
					class="slider"
					aria-label="Simplify tolerance"
				/>
				<button class="op-btn" onclick={runSimplify}>Apply</button>
			</div>
		</section>

		<!-- Measure -->
		<section class="op-section">
			<div class="op-header">Measure</div>
			<div class="op-controls gap4">
				<button class="op-btn" onclick={runArea}>Area</button>
				<button class="op-btn" onclick={runLength}>Length</button>
			</div>
		</section>

		<!-- Geometry -->
		<section class="op-section">
			<div class="op-header">Geometry</div>
			<div class="op-controls gap4">
				<button class="op-btn" onclick={runCentroid}>Centroid</button>
				<button class="op-btn" onclick={runBBox}>BBox</button>
				<button class="op-btn" onclick={runDissolve}>Dissolve</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.turf-panel {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.empty-state {
		padding: 20px 4px;
		color: var(--text-muted);
		font-size: 13px;
		line-height: 1.6;
		text-align: center;
	}

	.active-label {
		font-size: 12px;
		color: var(--text-muted);
		margin-bottom: 8px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.active-label strong {
		color: var(--text);
	}

	.result-banner {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		color: var(--accent);
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: var(--danger);
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 12px;
		margin-bottom: 8px;
	}

	.op-section {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 10px 12px;
		margin-bottom: 8px;
		background: var(--surface2);
	}

	.op-header {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tol-val {
		font-size: 11px;
		font-weight: 400;
		font-family: ui-monospace, monospace;
		text-transform: none;
	}

	.op-controls {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.op-controls.gap4 {
		gap: 4px;
		flex-wrap: wrap;
	}

	.num-input {
		width: 64px;
		padding: 5px 8px;
		border: 1px solid var(--border);
		border-radius: 5px;
		background: var(--surface);
		color: var(--text);
		font-size: 13px;
	}

	.slider {
		flex: 1;
		accent-color: var(--accent);
	}

	.op-btn {
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font-size: 12px;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.1s;
	}

	.op-btn:hover {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
</style>
