<script lang="ts">
	import { activeBasemap, darkMode, activeLayerId, statusMessage, sidebarOpen } from '$lib/stores/ui.js';
	import { layers, addLayer } from '$lib/stores/layers.js';
	import { parseGeoJSON } from '$lib/utils/geojson.js';
	import { downloadGeoJSON } from '$lib/utils/export.js';
	import { encodeToHash } from '$lib/utils/url-share.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	const BASEMAP_OPTIONS = [
		{ value: 'streets', label: 'Streets' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'satellite', label: 'Satellite' }
	];

	let error = $state('');

	function handleFileUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		readFile(file);
		(e.target as HTMLInputElement).value = '';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file) readFile(file);
	}

	function readFile(file: File) {
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const geojson = parseGeoJSON(ev.target!.result as string);
				const name = file.name.replace(/\.(geo)?json$/i, '');
				addLayer(geojson, name);
				error = '';
				const count = geojson.type === 'FeatureCollection' ? geojson.features.length : 1;
				statusMessage.set(`Loaded "${name}" — ${count} features`);
			} catch (err: any) {
				error = err.message;
			}
		};
		reader.readAsText(file);
	}

	function handleExport() {
		const id = $activeLayerId;
		const layer = $layers.find((l: any) => l.id === id) ?? $layers.at(-1);
		if (!layer) return;
		downloadGeoJSON(layer.geojson, `${layer.name}.geojson`);
		statusMessage.set(`Exported "${layer.name}"`);
	}

	function handleShare() {
		const id = $activeLayerId;
		const layer = $layers.find((l: any) => l.id === id) ?? $layers.at(-1);
		if (!layer) return;
		const hash = encodeToHash(layer.geojson);
		history.replaceState(null, '', `#${hash}`);
		navigator.clipboard?.writeText(location.href);
		statusMessage.set('Share URL copied to clipboard');
	}

	function toggleDarkMode() {
		darkMode.update((d) => {
			const next = !d;
			activeBasemap.set(next ? 'dark' : 'streets');
			return next;
		});
	}

	const selectedLabel = $derived(
		BASEMAP_OPTIONS.find((o) => o.value === $activeBasemap)?.label ?? 'Streets'
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	class="flex h-[var(--toolbar-h)] shrink-0 items-center justify-between gap-3 border-b bg-background px-4 z-50"
	ondragover={(e) => e.preventDefault()}
	ondrop={handleDrop}
>
	<div class="flex items-center gap-2">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary shrink-0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
		<span class="hidden sm:inline text-[15px] font-bold tracking-tight">GeoJSON Studio</span>
	</div>

	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" class="relative gap-1.5 overflow-hidden" title="Upload .geojson or .json">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
			<span class="hidden sm:inline">Upload</span>
			<input type="file" accept=".geojson,.json" onchange={handleFileUpload} class="absolute inset-0 cursor-pointer opacity-0" />
		</Button>

		<div class="hidden sm:flex items-center">
			<Select.Root type="single" value={$activeBasemap} onValueChange={(v) => v && activeBasemap.set(v)}>
				<Select.Trigger class="h-8 w-[110px] text-xs">{selectedLabel}</Select.Trigger>
				<Select.Content>
					{#each BASEMAP_OPTIONS as opt}
						<Select.Item value={opt.value}>{opt.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<div class="flex items-center gap-1.5">
		{#if error}
			<Badge variant="destructive" class="max-w-[120px] truncate text-[11px]">{error}</Badge>
		{/if}

		<Button variant="outline" size="sm" class="gap-1.5" onclick={handleShare} disabled={$layers.length === 0} title="Copy share URL">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
			<span class="hidden sm:inline">Share</span>
		</Button>

		<Button variant="outline" size="sm" class="gap-1.5" onclick={handleExport} disabled={$layers.length === 0} title="Download active layer">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
			<span class="hidden sm:inline">Export</span>
		</Button>

		<Button variant="ghost" size="icon-sm" onclick={toggleDarkMode} title="Toggle dark mode">
			{#if $darkMode}
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
			{:else}
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
			{/if}
		</Button>

		<!-- Mobile: sidebar toggle -->
		<Button variant="ghost" size="icon-sm" onclick={() => sidebarOpen.update(v => !v)} class="sm:hidden" title="Toggle panel">
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
		</Button>
	</div>
</header>
