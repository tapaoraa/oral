// Point d'entrée : initialisation de l'état, câblage des composants.

import { on } from './core/bus.js';
import { state, initState } from './core/store.js';
import { renderGrille } from './components/grille.js';
import { updateCompletion } from './components/scoring.js';
import { initBanner, updateBanner } from './components/banner.js';
import { initSidebar, renderSidebarList, closeSidebar } from './components/sidebar.js';
import { initSettingsModal } from './components/settings/modal.js';
import { initPrint } from './components/print.js';

// ── Service worker (hors-ligne) ─────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// ── Bloquer le zoom natif iPad (double-tap, pinch) ──────────
document.addEventListener('touchstart', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTap = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTap < 300) e.preventDefault();
  lastTap = now;
}, { passive: false });

// ── Câblage inter-composants ────────────────────────────────
on('render:grille', renderGrille);
on('grille:changed', updateCompletion); // témoin ✓ recalculé à chaque note saisie

on('eleve:select', (i, close = true) => {
  state.selectedEleveIdx = i;
  updateBanner();
  renderSidebarList();
  renderGrille();
  if (close) closeSidebar();
});

// ── Démarrage ───────────────────────────────────────────────
initState();
initBanner();
initSidebar();
initSettingsModal();
initPrint();
updateBanner();
renderGrille();
