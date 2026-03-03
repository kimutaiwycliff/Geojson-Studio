<script>
	import { addLayer } from '$lib/stores/layers.js';
	import { parseGeoJSON, validateGeoJSON } from '$lib/utils/geojson.js';
	import { statusMessage } from '$lib/stores/ui.js';

	let text = $state('');
	let error = $state('');
	let validMsg = $state('');

	const DEMO = JSON.stringify(
		{
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
					properties: { name: 'New York City', pop: 8336817 }
				},
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [-118.2437, 34.0522] },
					properties: { name: 'Los Angeles', pop: 3979576 }
				},
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] },
					properties: { name: 'Chicago', pop: 2693976 }
				}
			]
		},
		null,
		2
	);

	function handleRender() {
		if (!text.trim()) return;
		error = '';
		validMsg = '';
		try {
			const geojson = parseGeoJSON(text);
			const count =
				geojson.type === 'FeatureCollection' ? geojson.features.length : 1;
			addLayer(geojson, 'Pasted GeoJSON');
			text = '';
			statusMessage.set(`Rendered ${count} feature${count !== 1 ? 's' : ''}`);
		} catch (e) {
			error = e.message;
		}
	}

	function handleValidate() {
		if (!text.trim()) return;
		const result = validateGeoJSON(text);
		if (result.valid) {
			error = '';
			validMsg = '✓ Valid GeoJSON';
		} else {
			validMsg = '';
			error = result.error;
		}
	}

	function loadDemo() {
		text = DEMO;
		error = '';
		validMsg = '';
	}

	function handleKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleRender();
		}
	}
</script>

<div class="json-editor">
	<div class="editor-header">
		<span class="section-title">Paste GeoJSON</span>
		<button class="link-btn" onclick={loadDemo}>load demo</button>
	</div>

	<textarea
		bind:value={text}
		onkeydown={handleKeydown}
		placeholder={'Paste GeoJSON here...\n\n{\n  "type": "FeatureCollection",\n  "features": [...]\n}'}
		spellcheck="false"
		autocorrect="off"
	></textarea>

	{#if error}
		<div class="msg error">⚠ {error}</div>
	{/if}
	{#if validMsg}
		<div class="msg success">{validMsg}</div>
	{/if}

	<div class="editor-actions">
		<button class="btn-secondary" onclick={handleValidate} disabled={!text.trim()}>Validate</button>
		<button class="btn-primary" onclick={handleRender} disabled={!text.trim()}>
			Render ⌘↵
		</button>
	</div>
</div>

<style>
	.json-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
		padding: 12px;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 12px;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	textarea {
		flex: 1;
		resize: none;
		font-family: ui-monospace, 'Cascadia Code', monospace;
		font-size: 12px;
		line-height: 1.5;
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text);
		padding: 10px;
		min-height: 180px;
	}

	textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	.msg {
		font-size: 12px;
		padding: 6px 10px;
		border-radius: 4px;
	}

	.msg.error {
		background: #fef2f2;
		color: var(--danger);
		border: 1px solid #fecaca;
	}

	.msg.success {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.editor-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.btn-primary {
		padding: 7px 16px;
		border-radius: 6px;
		border: none;
		background: var(--accent);
		color: #fff;
		font-size: 13px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 7px 14px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
	}

	.btn-secondary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
