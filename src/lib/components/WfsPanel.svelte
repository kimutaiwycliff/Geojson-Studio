<script lang="ts">
	import { addLayer } from '$lib/stores/layers.js';
	import { statusMessage } from '$lib/stores/ui.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let baseUrl = $state('');
	let typename = $state('');
	let cqlFilter = $state('');
	let srsname = $state('EPSG:4326');
	let version = $state('2.0.0');
	let showAdvanced = $state(false);
	let showHeaders = $state(false);
	let loading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	let headers: { key: string; value: string }[] = $state([{ key: '', value: '' }]);

	function addHeaderRow() {
		headers = [...headers, { key: '', value: '' }];
	}

	function removeHeaderRow(i: number) {
		headers = headers.filter((_, idx) => idx !== i);
	}

	async function fetchWfs() {
		errorMsg = '';
		successMsg = '';

		if (!baseUrl.trim() || !typename.trim()) {
			errorMsg = 'Base URL and Typename are required.';
			return;
		}

		const customHeaders: Record<string, string> = {};
		for (const h of headers) {
			if (h.key.trim()) customHeaders[h.key.trim()] = h.value;
		}

		loading = true;
		try {
			const res = await fetch('/api/wfs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					baseUrl: baseUrl.trim(),
					typename: typename.trim(),
					cqlFilter,
					srsname,
					version,
					customHeaders
				})
			});

			const data = await res.json();

			if (!res.ok) {
				errorMsg = data.message ?? `Server error ${res.status}`;
				return;
			}

			const count = data.features?.length ?? 0;
			if (count === 0) {
				errorMsg = 'Query returned 0 features. Check typename or CQL filter.';
				return;
			}

			const layerName = typename.split(':').pop() ?? typename;
			addLayer(data, layerName);
			statusMessage.set(`Loaded ${count} feature${count !== 1 ? 's' : ''} from WFS`);
			successMsg = `✓ Loaded ${count} feature${count !== 1 ? 's' : ''}`;
		} catch (e: any) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col gap-2 p-3">
	<!-- Connection -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>

		<div class="space-y-1.5">
			<label for="wfs-url" class="text-[11px] text-muted-foreground">Base URL</label>
			<Input
				id="wfs-url"
				bind:value={baseUrl}
				placeholder="http://host/geoserver/wfs"
				class="h-7 text-xs font-mono"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="wfs-typename" class="text-[11px] text-muted-foreground">Typename</label>
			<Input
				id="wfs-typename"
				bind:value={typename}
				placeholder="workspace:layer_name"
				class="h-7 text-xs font-mono"
			/>
		</div>
	</section>

	<!-- CQL Filter -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CQL Filter <span class="normal-case font-normal">(optional)</span></p>
		<Textarea
			bind:value={cqlFilter}
			placeholder={"parcel_number IN ('NAIROBI/BLOCK118/21')\n\n— or leave blank to fetch all"}
			spellcheck={false}
			class="min-h-[72px] resize-none font-mono text-xs leading-relaxed"
		/>
	</section>

	<!-- Custom Headers -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<button
			class="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
			onclick={() => (showHeaders = !showHeaders)}
		>
			<span>Auth Headers</span>
			<svg
				width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2.5"
				class="transition-transform {showHeaders ? 'rotate-180' : ''}"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>

		{#if showHeaders}
			<div class="space-y-1.5">
				{#each headers as h, i}
					<div class="flex gap-1.5 items-center">
						<Input
							bind:value={h.key}
							placeholder="Header name"
							class="h-7 flex-1 text-xs font-mono"
						/>
						<Input
							bind:value={h.value}
							placeholder="Value"
							class="h-7 flex-1 text-xs font-mono"
						/>
						<button
							onclick={() => removeHeaderRow(i)}
							class="shrink-0 text-muted-foreground hover:text-destructive"
							title="Remove row"
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/each}
				<Button variant="ghost" size="sm" class="h-7 w-full text-xs" onclick={addHeaderRow}>
					+ Add header
				</Button>
			</div>
		{/if}
	</section>

	<!-- Advanced -->
	<section class="rounded-lg border bg-muted/30 p-3 space-y-2">
		<button
			class="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
			onclick={() => (showAdvanced = !showAdvanced)}
		>
			<span>Advanced</span>
			<svg
				width="12" height="12" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2.5"
				class="transition-transform {showAdvanced ? 'rotate-180' : ''}"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>

		{#if showAdvanced}
			<div class="space-y-1.5">
				<div class="space-y-1">
					<label for="wfs-srs" class="text-[11px] text-muted-foreground">SRS Name</label>
					<Input
						id="wfs-srs"
						bind:value={srsname}
						placeholder="EPSG:4326"
						class="h-7 text-xs font-mono"
					/>
					<p class="text-[10px] text-muted-foreground">Must be EPSG:4326 for correct map rendering.</p>
				</div>
				<div class="space-y-1">
					<label for="wfs-version" class="text-[11px] text-muted-foreground">WFS Version</label>
					<Input
						id="wfs-version"
						bind:value={version}
						placeholder="2.0.0"
						class="h-7 text-xs font-mono"
					/>
				</div>
			</div>
		{/if}
	</section>

	{#if errorMsg}
		<Badge variant="destructive" class="justify-start text-wrap py-1.5 font-normal text-xs">⚠ {errorMsg}</Badge>
	{/if}
	{#if successMsg}
		<Badge class="justify-start bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-normal text-xs">{successMsg}</Badge>
	{/if}

	<Button
		size="sm"
		class="w-full"
		onclick={fetchWfs}
		disabled={loading || !baseUrl.trim() || !typename.trim()}
	>
		{#if loading}
			<svg class="mr-2 animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path d="M21 12a9 9 0 1 1-6.219-8.56" />
			</svg>
			Fetching…
		{:else}
			Fetch & Render
		{/if}
	</Button>
</div>
