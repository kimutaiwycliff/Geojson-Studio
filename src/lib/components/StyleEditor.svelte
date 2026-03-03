<script lang="ts">
	import { layers, updateLayerStyle } from '$lib/stores/layers.js';
	import { activeLayerId } from '$lib/stores/ui.js';
	import { derived } from 'svelte/store';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';

	const activeLayer = derived([layers, activeLayerId], ([$layers, $id]: any[]) =>
		$layers.find((l: any) => l.id === $id) ?? null
	);

	function update(key: string, value: any) {
		if ($activeLayer) updateLayerStyle($activeLayer.id, { [key]: value });
	}
</script>

{#if $activeLayer}
	<div class="flex flex-col gap-4 p-3">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
			Style — {$activeLayer.name}
		</p>

		<!-- Fill color -->
		<div class="flex items-center justify-between gap-3">
			<Label for="fill-color" class="text-xs shrink-0">Fill color</Label>
			<input
				id="fill-color"
				type="color"
				value={$activeLayer.style.fillColor}
				oninput={(e) => update('fillColor', (e.target as HTMLInputElement).value)}
				class="h-7 w-8 cursor-pointer rounded border border-border bg-background p-0.5"
			/>
		</div>

		<!-- Stroke color -->
		<div class="flex items-center justify-between gap-3">
			<Label for="stroke-color" class="text-xs shrink-0">Stroke color</Label>
			<input
				id="stroke-color"
				type="color"
				value={$activeLayer.style.strokeColor}
				oninput={(e) => update('strokeColor', (e.target as HTMLInputElement).value)}
				class="h-7 w-8 cursor-pointer rounded border border-border bg-background p-0.5"
			/>
		</div>

		<!-- Opacity -->
		<div class="flex flex-col gap-1.5">
			<div class="flex justify-between">
				<Label for="opacity" class="text-xs">Opacity</Label>
				<span class="font-mono text-[11px] text-muted-foreground">{$activeLayer.style.opacity.toFixed(2)}</span>
			</div>
			<Slider
				id="opacity"
				min={0} max={1} step={0.05}
				value={[$activeLayer.style.opacity]}
				onValueChange={(v) => update('opacity', v[0])}
			/>
		</div>

		<!-- Point radius -->
		<div class="flex flex-col gap-1.5">
			<div class="flex justify-between">
				<Label for="point-radius" class="text-xs">Point radius</Label>
				<span class="font-mono text-[11px] text-muted-foreground">{$activeLayer.style.pointRadius}px</span>
			</div>
			<Slider
				id="point-radius"
				min={2} max={20} step={1}
				value={[$activeLayer.style.pointRadius]}
				onValueChange={(v) => update('pointRadius', v[0])}
			/>
		</div>
	</div>
{:else}
	<p class="px-4 py-5 text-center text-xs text-muted-foreground">
		Select a layer to edit its style.
	</p>
{/if}
