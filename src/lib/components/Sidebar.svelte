<script lang="ts">
	import { sidebarOpen } from '$lib/stores/ui.js';
	import JsonEditor from './JsonEditor.svelte';
	import LayerList from './LayerList.svelte';
	import StyleEditor from './StyleEditor.svelte';
	import TurfPanel from './TurfPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

{#if $sidebarOpen}
	<aside class="absolute left-0 top-0 bottom-0 z-10 flex w-[var(--sidebar-w)] flex-col border-r bg-background shadow-sm">
		<Tabs.Root value="editor" class="flex flex-1 flex-col overflow-hidden">
			<div class="flex items-center border-b bg-muted/40">
				<Tabs.List class="h-10 rounded-none bg-transparent px-1 gap-0">
					<Tabs.Trigger value="editor" class="rounded-none border-b-2 border-transparent px-4 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
						Editor
					</Tabs.Trigger>
					<Tabs.Trigger value="layers" class="rounded-none border-b-2 border-transparent px-4 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
						Layers
					</Tabs.Trigger>
					<Tabs.Trigger value="turf" class="rounded-none border-b-2 border-transparent px-4 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
						Turf
					</Tabs.Trigger>
				</Tabs.List>
				<Button
					variant="ghost"
					size="icon-sm"
					class="ml-auto mr-1 text-muted-foreground"
					onclick={() => sidebarOpen.set(false)}
					title="Collapse sidebar"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
				</Button>
			</div>

			<Tabs.Content value="editor" class="flex-1 overflow-auto data-[state=inactive]:hidden mt-0">
				<JsonEditor />
			</Tabs.Content>

			<Tabs.Content value="layers" class="flex-1 overflow-auto data-[state=inactive]:hidden mt-0">
				<LayerList />
				<Separator />
				<StyleEditor />
			</Tabs.Content>

			<Tabs.Content value="turf" class="flex-1 overflow-auto data-[state=inactive]:hidden mt-0">
				<TurfPanel />
			</Tabs.Content>
		</Tabs.Root>
	</aside>
{:else}
	<Button
		variant="outline"
		size="icon-sm"
		class="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-l-none border-l-0"
		onclick={() => sidebarOpen.set(true)}
		title="Expand sidebar"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
	</Button>
{/if}
