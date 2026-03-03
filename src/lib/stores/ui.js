import { writable } from 'svelte/store';

export const sidebarOpen = writable(true);
export const darkMode = writable(false);
export const activeLayerId = writable(null);
export const activeBasemap = writable('streets');
export const mouseCoords = writable('');
export const statusMessage = writable('');
