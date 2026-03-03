<script>
	import { sidebarOpen } from '$lib/stores/ui.js';
	import JsonEditor from './JsonEditor.svelte';
	import LayerList from './LayerList.svelte';
	import StyleEditor from './StyleEditor.svelte';
	import TurfPanel from './TurfPanel.svelte';

	let activeTab = $state('editor'); // 'editor' | 'layers' | 'turf'

	const TABS = [
		{ id: 'editor', label: 'Editor' },
		{ id: 'layers', label: 'Layers' },
		{ id: 'turf', label: 'Turf' }
	];
</script>

{#if $sidebarOpen}
	<aside class="sidebar">
		<nav class="tabs">
			{#each TABS as tab}
				<button
					class="tab-btn"
					class:active={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
			<button class="tab-btn collapse-btn" onclick={() => sidebarOpen.set(false)} title="Collapse sidebar">
				‹
			</button>
		</nav>

		<div class="panel">
			{#if activeTab === 'editor'}
				<JsonEditor />
			{:else if activeTab === 'layers'}
				<div class="layers-panel">
					<LayerList />
					<div class="divider"></div>
					<StyleEditor />
				</div>
			{:else if activeTab === 'turf'}
				<TurfPanel />
			{/if}
		</div>
	</aside>
{:else}
	<button class="expand-btn" onclick={() => sidebarOpen.set(true)} title="Expand sidebar">›</button>
{/if}

<style>
	.sidebar {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: var(--sidebar-w);
		background: var(--surface);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		z-index: 100;
		box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06);
	}

	.tabs {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--surface2);
	}

	.tab-btn {
		padding: 10px 16px;
		border: none;
		background: none;
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}

	.tab-btn:hover {
		color: var(--text);
	}

	.tab-btn.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
		font-weight: 600;
	}

	.collapse-btn {
		margin-left: auto;
		font-size: 18px;
		padding: 10px 14px;
	}

	.panel {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.layers-panel {
		display: flex;
		flex-direction: column;
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: 4px 0;
	}

	.expand-btn {
		position: absolute;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		z-index: 100;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: none;
		border-radius: 0 6px 6px 0;
		padding: 12px 6px;
		cursor: pointer;
		font-size: 18px;
		color: var(--text-muted);
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
	}

	.expand-btn:hover {
		color: var(--accent);
	}
</style>
