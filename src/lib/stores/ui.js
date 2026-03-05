import { writable } from 'svelte/store';

export const sidebarOpen = writable(true);
export const darkMode = writable(true);
export const activeLayerId = writable(null);
export const activeBasemap = writable('dark');
export const mouseCoords = writable('');
export const statusMessage = writable('');
