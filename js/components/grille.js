// Rendu de la grille de notation (sections par catégorie).

import { $, el } from '../core/dom.js';
import { state, getStudentScores, CAT_COLOR_PALETTE } from '../core/store.js';
import { setScore, updateTotalBar, updateItemScore, updateCompletion } from './scoring.js';
import { renderCheckWidget } from './widgets/check.js';
import { renderLevelWidget } from './widgets/level.js';
import { renderColumnsWidget } from './widgets/columns.js';

export function renderGrille() {
  const container = $('grille-sections');
  container.innerHTML = '';
  const studentScores = getStudentScores();

  state.gradeData.forEach((cat, ci) => {
    const color  = cat.color || CAT_COLOR_PALETTE[ci % CAT_COLOR_PALETTE.length];
    const catPts = cat.items.reduce((s, it) => s + (it.pts ?? 10), 0);
    const deferredUpdates = [];

    const hdr = el('div', { className: 'cat-header' });
    hdr.innerHTML = `<span>${cat.name}</span>` +
      `<span class="cat-pts">` +
        `<strong id="cat-total-${ci}" class="cat-total-score">—</strong>` +
        `<span class="cat-total-max"> / ${catPts} pts</span>` +
      `</span>`;

    const table = el('table', { className: 'cat-table' });
    const thead = el('thead');
    thead.innerHTML = `<tr><th class="th-item">Item</th><th class="th-eval">Évaluation</th></tr>`;
    table.appendChild(thead);

    const tbody = el('tbody');
    cat.items.forEach(item => {
      const itemPts = item.pts ?? 10;
      const itemId  = item.id;

      const scoreP = el('p', { className: 'item-score', id: `score-${itemId}`, style: `color:${color};` });
      setScore(scoreP, 0, itemPts, true);

      const tdL = el('td', { className: 'td-item' },
        el('p', { className: 'item-name', textContent: item.name }),
        scoreP,
      );

      const tdR = el('td', { className: 'td-eval' });

      if (item.modality === 'check' && item.config?.pills?.length) {
        tdR.appendChild(renderCheckWidget(item, scoreP, studentScores[itemId]?.states || []));
      } else if (item.modality === 'level' && item.config?.groups?.length) {
        tdR.appendChild(renderLevelWidget(item, studentScores[itemId]?.groupStates || []));
        deferredUpdates.push([itemId, itemPts]);
      } else if (item.modality === 'columns' && item.config?.levels?.length) {
        tdR.appendChild(renderColumnsWidget(item, scoreP, studentScores[itemId] || null));
      }

      tbody.appendChild(el('tr', {}, tdL, tdR));
    });
    table.appendChild(tbody);

    const section = el('section', { className: 'cat-section' }, hdr, table);
    container.appendChild(section);

    // Le calcul des items "level" interroge le DOM : après insertion.
    deferredUpdates.forEach(([id, pts]) => updateItemScore(id, pts));

    // thead sticky juste sous le header de catégorie
    thead.style.position = 'sticky';
    thead.style.top = hdr.offsetHeight + 'px';
    thead.style.zIndex = '9';
  });

  updateTotalBar();
  updateCompletion();
}
