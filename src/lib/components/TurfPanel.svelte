<script lang="ts">
	import { layers, addLayer, updateLayer } from '$lib/stores/layers.js';
	import { activeLayerId, statusMessage } from '$lib/stores/ui.js';
	import { derived } from 'svelte/store';
	import * as turfOps from '$lib/utils/turf-ops.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	const activeLayer = derived([layers, activeLayerId], ([$layers, $id]: any[]) =>
		$layers.find((l: any) => l.id === $id) ?? null
	);

	let bufferDist = $state(10);
	let bufferUnit = $state('kilometers');
	let simplifyTol = $state(0.005);
	let result = $state('');
	let resultError = $state('');

	const UNIT_LABEL: Record<string, string> = { meters: 'm', kilometers: 'km', miles: 'mi' };

	function clearMessages() { result = ''; resultError = ''; }

	function runBuffer() {
		if (!$activeLayer) return; clearMessages();
		try {
			const out = turfOps.buffer($activeLayer.geojson, bufferDist, bufferUnit);
			addLayer(out, `${$activeLayer.name} buffer ${bufferDist}${UNIT_LABEL[bufferUnit]}`);
			statusMessage.set(`Buffered "${$activeLayer.name}"`);
		} catch (e: any) { resultError = e.message; }
	}

	function runSimplify() {
		if (!$activeLayer) return; clearMessages();
		try {
			const out = turfOps.simplify($activeLayer.geojson, simplifyTol);
			updateLayer($activeLayer.id, { geojson: out });
			statusMessage.set(`Simplified "${$activeLayer.name}"`);
		} catch (e: any) { resultError = e.message; }
	}

	function runArea() {
		if (!$activeLayer) return; clearMessages();
		try { result = `Area: ${turfOps.calculateArea($activeLayer.geojson)}`; }
		catch (e: any) { resultError = e.message; }
	}

	function runLength() {
		if (!$activeLayer) return; clearMessages();
		try { result = `Length: ${turfOps.calculateLength($activeLayer.geojson)}`; }
		catch (e: any) { resultError = e.message; }
	}

	function runCentroid() {
		if (!$activeLayer) return; clearMessages();
		try {
			addLayer(turfOps.centroid($activeLayer.geojson), `${$activeLayer.name} centroid`);
			statusMessage.set('Centroid added as new layer');
		} catch (e: any) { resultError = e.message; }
	}

	function runBBox() {
		if (!$activeLayer) return; clearMessages();
		try {
			addLayer(turfOps.bboxLayer($activeLayer.geojson), `${$activeLayer.name} bbox`);
			statusMessage.set('Bounding box added as new layer');
		} catch (e: any) { resultError = e.message; }
	}

	function runDissolve() {
		if (!$activeLayer) return; clearMessages();
		try {
			addLayer(turfOps.dissolve($activeLayer.geojson), `${$activeLayer.name} dissolved`);
			statusMessage.set('Dissolved layer added');
		} catch (e: any) { resultError = e.message; }
	}

	const unitLabel = $derived(UNIT_LABEL[bufferUnit] ?? bufferUnit);
</script>

<div class="flex flex-col gap-2 p-3">
	{#if !$activeLayer}
		<p class="py-6 text-center text-xs text-muted-foreground leading-relaxed">
			Select a layer in the Layers tab to run operations on it.
		</p>
	{:else}
		<p class="truncate text-xs text-muted-foreground">
			Operating on: <span class="font-semibold text-foreground">{$activeLayer.name}</span>
		</p>

		{#if result}
			<div class="rounded-md border border-primary/30 bg-primary/10 p-2.5 text-sm font-semibold text-primary">
				{result}
			</div>
		{/if}
		{#if resultError}
			<Badge variant="destructive" class="justify-start text-wrap py-1.5 font-normal text-xs">⚠ {resultError}</Badge>
		{/if}

		<!-- Buffer -->
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Buffer</p>
			<div class="flex items-center gap-2">
				<Input
					type="number"
					bind:value={bufferDist}
					min={0}
					step={1}
					class="h-7 w-16 px-2 text-xs"
					aria-label="Buffer distance"
				/>
				<Select.Root type="single" value={bufferUnit} onValueChange={(v) => v && (bufferUnit = v)}>
					<Select.Trigger class="h-7 w-[72px] text-xs">{unitLabel}</Select.Trigger>
					<Select.Content>
						<Select.Item value="meters">m</Select.Item>
						<Select.Item value="kilometers">km</Select.Item>
						<Select.Item value="miles">mi</Select.Item>
					</Select.Content>
				</Select.Root>
				<Button variant="outline" size="sm" class="h-7 text-xs ml-auto" onclick={runBuffer}>Apply</Button>
			</div>
		</section>

		<!-- Simplify -->
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<div class="flex items-center justify-between">
				<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Simplify</p>
				<span class="font-mono text-[11px] text-muted-foreground">{simplifyTol}</span>
			</div>
			<div class="flex items-center gap-3">
				<Slider
					min={0.0001} max={0.1} step={0.0001}
					value={[simplifyTol]}
					onValueChange={(v) => (simplifyTol = v[0])}
					class="flex-1"
					aria-label="Simplify tolerance"
				/>
				<Button variant="outline" size="sm" class="h-7 text-xs shrink-0" onclick={runSimplify}>Apply</Button>
			</div>
		</section>

		<!-- Measure -->
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Measure</p>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" class="h-7 flex-1 text-xs" onclick={runArea}>Area</Button>
				<Button variant="outline" size="sm" class="h-7 flex-1 text-xs" onclick={runLength}>Length</Button>
			</div>
		</section>

		<!-- Geometry -->
		<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Geometry</p>
			<div class="flex flex-wrap gap-2">
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={runCentroid}>Centroid</Button>
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={runBBox}>BBox</Button>
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={runDissolve}>Dissolve</Button>
			</div>
		</section>
	{/if}
</div>
