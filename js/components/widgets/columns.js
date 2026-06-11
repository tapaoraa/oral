// Widget "columns" : colonnes de niveaux ; un appui ouvre la colonne,
// puis on choisit le nombre de points dans le pas configuré.

import { el } from '../../core/dom.js';
import { saveItemScore } from '../../core/store.js';
import { setScore, updateTotalBar } from '../scoring.js';

export function renderColumnsWidget(item, scoreNode, initialState) {
  const itemId  = item.id;
  const itemMax = item.pts ?? 10;
  const pas     = item.config.pas ?? 1;
  const levels  = item.config.levels;

  let activeCol   = initialState?.colIdx ?? -1;
  let score       = initialState?.score  ?? 0;
  let ptBoxChosen = initialState?.ptBoxChosen === true;

  const widget = el('div', { className: 'modal3-widget' });

  levels.forEach((lvl, ci) => {
    const col = el('div', { className: 'modal3-col' });
    const label = el('div', { className: 'modal3-label' });
    label.innerHTML = lvl.label.replace(/\n/g, '<br>');

    const ptsContainer = el('div', { className: 'modal3-pts' });
    const prevMax = ci === 0 ? -pas : levels[ci - 1].max;
    const start = Math.round((prevMax + pas) * 100) / 100;
    for (let v = start; v <= lvl.max; v = Math.round((v + pas) * 100) / 100) {
      const box = el('span', { className: 'pt-box', textContent: v, dataset: { val: v } });
      box.addEventListener('click', e => {
        e.stopPropagation();
        ptsContainer.querySelectorAll('.pt-box').forEach(b => {
          b.classList.remove('chosen');
          b.style.background  = lvl.color + '22';
          b.style.borderColor = lvl.color + '55';
          b.style.color       = lvl.color;
        });
        box.classList.add('chosen');
        box.style.background  = lvl.color;
        box.style.borderColor = lvl.color;
        box.style.color       = '#fff';
        score = v; ptBoxChosen = true;
        setScore(scoreNode, score, itemMax, false);
        saveItemScore(itemId, { type: 'columns', colIdx: activeCol, score, ptBoxChosen: true });
        updateTotalBar();
      });
      ptsContainer.appendChild(box);
    }

    col.appendChild(ptsContainer);
    col.appendChild(label);
    col.style.background = lvl.color + '18';

    col.addEventListener('click', () => {
      if (activeCol === ci) {
        col.classList.remove('active');
        col.style.background = lvl.color + '18';
        activeCol = -1; score = 0; ptBoxChosen = false;
        ptsContainer.querySelectorAll('.pt-box').forEach(b => b.classList.remove('chosen'));
      } else {
        widget.querySelectorAll('.modal3-col').forEach((c, i) => {
          c.classList.remove('active');
          c.style.background = levels[i].color + '18';
          c.querySelectorAll('.pt-box').forEach(b => {
            b.classList.remove('chosen');
            b.style.background = b.style.borderColor = b.style.color = '';
          });
        });
        col.classList.add('active');
        col.style.background = lvl.color + '55';
        activeCol = ci; score = 0; ptBoxChosen = false;
      }
      updateLabels();
      setScore(scoreNode, score, itemMax, !ptBoxChosen);
      saveItemScore(itemId, { type: 'columns', colIdx: activeCol, score, ptBoxChosen });
      updateTotalBar();
    });

    // Restauration de l'état initial
    if (activeCol === ci) {
      col.classList.add('active');
      col.style.background = lvl.color + '55';
      if (initialState?.score > 0) {
        ptsContainer.querySelectorAll('.pt-box').forEach(b => {
          if (Number(b.dataset.val) === initialState.score) {
            b.classList.add('chosen');
            b.style.background  = lvl.color;
            b.style.borderColor = lvl.color;
            b.style.color       = '#fff';
          } else {
            b.style.background  = lvl.color + '22';
            b.style.borderColor = lvl.color + '55';
            b.style.color       = lvl.color;
          }
        });
      }
      setScore(scoreNode, score, itemMax, !ptBoxChosen);
    }

    widget.appendChild(col);
  });

  function updateLabels() {
    widget.querySelectorAll('.modal3-col').forEach((c, i) => {
      const lbl = c.querySelector('.modal3-label');
      if (!lbl) return;
      lbl.style.color = activeCol === i ? '#374151' : activeCol === -1 ? '#6b7280' : '#9ca3af';
      lbl.style.fontWeight = activeCol === i ? '600' : '400'; // semi-gras sur la colonne sélectionnée
    });
  }
  updateLabels();

  return el('div', { className: 'widget-scroll' }, widget);
}
