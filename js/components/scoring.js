// Affichage des scores par item et total général.

import { $ } from '../core/dom.js';
import { state, getStudentScores, isGrilleComplete } from '../core/store.js';

// Écrit le score dans la cellule de l'item. `empty` = item non encore évalué.
export function setScore(node, score, max, empty = false) {
  if (!node) return;
  if (empty) {
    node.innerHTML = `<span class="score-empty">/ ${max} pts</span>`;
    node.dataset.scored = '';
  } else {
    node.innerHTML = `<strong>${score}</strong> <span class="score-max">/ ${max} pts</span>`;
    node.dataset.scored = String(score);
  }
}

export function updateTotalBar() {
  let total = 0, max = 0, anyScored = false;
  state.gradeData.forEach((cat, ci) => {
    let catTotal = 0, catAny = false;
    cat.items.forEach(item => {
      max += (item.pts ?? 10);
      const node = $('score-' + item.id);
      if (node && node.dataset.scored !== '' && node.dataset.scored !== undefined) {
        const v = parseFloat(node.dataset.scored || 0);
        total += v; catTotal += v;
        anyScored = true; catAny = true;
      }
    });
    const catNode = $('cat-total-' + ci);
    if (catNode) catNode.textContent = catAny ? catTotal : '—';
  });
  const scoreEl = $('total-bar-score');
  if (scoreEl) scoreEl.textContent = anyScored ? total : '—';
  const maxEl = $('total-bar-max');
  if (maxEl) maxEl.textContent = `/ ${max} pts`;
}

// Affiche le témoin ✓ quand tous les items notables sont complets pour l'élève courant.
export function updateCompletion() {
  const node = $('total-bar-check');
  if (!node) return;
  const complete = state.selectedEleveIdx !== null && isGrilleComplete(getStudentScores());
  node.classList.toggle('show', complete);
}

// Recalcule le score d'un item "level" à partir de l'état de ses pills.
export function updateItemScore(itemId, itemPts) {
  const pills = [...document.querySelectorAll(`.level-pill-widget[data-item="${itemId}"]`)];
  const anyTouched = pills.some(w => (w._state ?? 0) > 0);
  const sumCurrent = pills.reduce((s, w) => s + (w._currentPts || 0), 0);
  const sumMax     = pills.reduce((s, w) => s + (w._pillMax    || 0), 0);
  const score = sumMax > 0 ? Math.round((sumCurrent / sumMax) * itemPts) : 0;
  setScore($(`score-${itemId}`), score, itemPts, !anyTouched);
  updateTotalBar();
}
