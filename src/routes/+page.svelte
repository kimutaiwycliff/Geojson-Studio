<script>
	import { onMount } from 'svelte';
	import Map from '$lib/components/Map.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { darkMode, mouseCoords, statusMessage } from '$lib/stores/ui.js';
	import { addLayer } from '$lib/stores/layers.js';
	import { decodeFromHash } from '$lib/utils/url-share.js';

	// Apply dark mode class to <html>
	$effect(() => {
		document.documentElement.dataset.theme = $darkMode ? 'dark' : 'light';
	});

	// Restore from URL hash on first load
	onMount(() => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			try {
				const geojson = decodeFromHash(hash);
				if (geojson) addLayer(geojson, 'Shared Layer');
			} catch {
				/* ignore bad hash */
			}
		}
	});
</script>

<svelte:head>
	<title>GeoJSON Studio</title>
	<meta name="description" content="Browser-based GeoJSON editor and visualizer" />
</svelte:head>

<div class="app">
	<Toolbar />
	<div class="workspace">
		<Map />
		<Sidebar />
	</div>
	<div class="status-bar">
		<span class="status-msg">{$statusMessage || 'Ready — drag & drop a GeoJSON file to get started'}</span>
		<span class="coords">{$mouseCoords}</span>
	</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.workspace {
		position: relative;
		flex: 1;
		overflow: hidden;
	}

	.status-bar {
		height: var(--statusbar-h);
		background: var(--surface);
		border-top: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		font-size: 12px;
		color: var(--text-muted);
		flex-shrink: 0;
		z-index: 200;
	}

	.status-msg {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.coords {
		font-family: ui-monospace, 'Cascadia Code', monospace;
		font-size: 11px;
		flex-shrink: 0;
		margin-left: 16px;
	}
</style>
