// Mini bus d'événements pour découpler les composants.
// Événements utilisés :
//   eleve:select (idx, closeSidebar)  — sélection d'un élève
//   render:grille                     — re-rendu de la grille de notation
//   render:sidebar                    — re-rendu de la liste latérale
//   render:banner                     — re-rendu du bandeau élève

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
}

export function emit(event, ...args) {
  const set = listeners.get(event);
  if (set) set.forEach(fn => fn(...args));
}
