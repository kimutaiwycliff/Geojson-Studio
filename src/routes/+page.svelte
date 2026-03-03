<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/components/Map.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { darkMode, mouseCoords, statusMessage } from '$lib/stores/ui.js';
	import { addLayer } from '$lib/stores/layers.js';
	import { decodeFromHash } from '$lib/utils/url-share.js';

	// Toggle .dark class on <html> (shadcn + Tailwind standard)
	$effect(() => {
		document.documentElement.classList.toggle('dark', $darkMode);
	});

	// Restore shared GeoJSON from URL hash
	onMount(() => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			try {
				const geojson = decodeFromHash(hash);
				if (geojson) addLayer(geojson, 'Shared Layer');
			} catch { /* ignore bad hash */ }
		}
	});
</script>

<svelte:head>
	<title>GeoJSON Studio</title>
	<meta name="description" content="Browser-based GeoJSON editor and visualizer" />
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden">
	<Toolbar />

	<div class="relative flex-1 overflow-hidden">
		<Map />
		<Sidebar />
	</div>

	<div class="flex h-[var(--statusbar-h)] shrink-0 items-center justify-between border-t bg-background px-3.5 z-50">
		<span class="truncate text-[11px] text-muted-foreground">
			{$statusMessage || 'Ready — drag & drop a GeoJSON file to get started'}
		</span>
		<span class="ml-4 shrink-0 font-mono text-[10px] text-muted-foreground">
			{$mouseCoords}
		</span>
	</div>
</div>
