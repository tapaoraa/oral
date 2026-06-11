// Widget "level" : un groupe de critères, chaque pill cycle entre les niveaux.
// Deux modes d'affichage : "detail" (tous les niveaux listés) et "simple" (niveau courant seul).

import { el } from '../../core/dom.js';
import { state, saveItemScore } from '../../core/store.js';
import { updateItemScore } from '../scoring.js';

export function renderLevelWidget(item, initGroupStates) {
  const itemId  = item.id;
  const itemPts = item.pts ?? 10;

  const wrap = el('div', { className: 'level-wrap' });
  item.config.groups.forEach((grp, gi) => {
    const w = el('div', {
      className: 'level-pill-widget',
      dataset: {
        item: itemId,
        itemMax: itemPts,
        title: grp.title,
        levels: JSON.stringify(grp.levels),
        groupIdx: gi,
      },
    });
    wrap.appendChild(w);
    if (state.pillMode === 'detail') initDetail(w, initGroupStates);
    else initSimple(w, initGroupStates);
  });

  return el('div', { className: 'widget-scroll widget-pad' }, wrap);
}

function saveGroupStates(itemId) {
  const allWidgets = [...document.querySelectorAll(`.level-pill-widget[data-item="${itemId}"]`)];
  const groupStates = allWidgets.map(w => w._state ?? 0);
  saveItemScore(itemId, { type: 'level', groupStates });
}

// ── Mode simplifié : pill compacte, niveau courant uniquement ──
function initSimple(widget, initialGroupStates) {
  const levels   = JSON.parse(widget.dataset.levels);
  const itemId   = widget.dataset.item;
  const itemPts  = Number(widget.dataset.itemMax);
  const groupIdx = Number(widget.dataset.groupIdx);
  let lvlState = initialGroupStates?.[groupIdx] ?? 0;
  widget._currentPts = lvlState > 0 ? levels[lvlState - 1].pts : 0;
  widget._pillMax    = levels[levels.length - 1].pts;

  const titleEl = el('div', { className: 'level-simple-title', textContent: widget.dataset.title });
  const labelEl = el('div', { className: 'level-simple-label', textContent: '—' });
  const dotsEl  = el('div', { className: 'level-simple-dots' });
  levels.forEach(lvl => {
    dotsEl.appendChild(el('span', {
      className: 'level-dot',
      style: `background:${lvl.color};filter:saturate(0.5) brightness(1.3);`,
    }));
  });

  const pill = el('div', { className: 'level-pill-btn level-pill-simple' },
    titleEl,
    el('div', { className: 'level-simple-row' }, labelEl, dotsEl),
  );
  pill.addEventListener('click', () => {
    lvlState = (lvlState + 1) % (levels.length + 1);
    update();
    saveGroupStates(itemId);
  });

  widget.appendChild(pill);
  if (lvlState > 0) update(true);

  function update(skipScore = false) {
    widget._state = lvlState;
    const dots = [...dotsEl.querySelectorAll('span')];
    if (lvlState === 0) {
      widget._currentPts     = 0;
      pill.style.background  = '#f3f4f6';
      pill.style.borderColor = '#d1d5db';
      titleEl.style.color    = '#6b7280';
      labelEl.style.color    = '#9ca3af';
      labelEl.textContent    = '—';
      dots.forEach(d => { d.style.filter = 'saturate(0.15) brightness(1.7)'; });
    } else {
      const lvl = levels[lvlState - 1];
      widget._currentPts     = lvl.pts;
      pill.style.background  = lvl.color + '15';
      pill.style.borderColor = lvl.color;
      titleEl.style.color    = lvl.color;
      labelEl.style.color    = lvl.color;
      labelEl.textContent    = lvl.label;
      dots.forEach((d, i) => { d.style.filter = i === lvlState - 1 ? 'none' : 'saturate(0.5) brightness(1.3)'; });
    }
    if (!skipScore) updateItemScore(itemId, itemPts);
  }
}

// ── Mode détaillé : tous les niveaux listés dans la pill ──
function initDetail(widget, initialGroupStates) {
  const levels   = JSON.parse(widget.dataset.levels);
  const itemId   = widget.dataset.item;
  const itemPts  = Number(widget.dataset.itemMax);
  const groupIdx = Number(widget.dataset.groupIdx);
  let lvlState = initialGroupStates?.[groupIdx] ?? 0;
  widget._currentPts = lvlState > 0 ? levels[lvlState - 1].pts : 0;
  widget._pillMax    = levels[levels.length - 1].pts;

  const titleEl = el('div', { className: 'level-detail-title', textContent: widget.dataset.title });

  const pill = el('div', { className: 'level-pill-btn level-pill-detail' }, titleEl);
  pill.addEventListener('click', () => {
    lvlState = (lvlState + 1) % (levels.length + 1);
    update();
    saveGroupStates(itemId);
  });

  levels.forEach(lvl => {
    const row = el('div', { className: 'level-legend-row' });
    // Double rendu (visible + gras caché) pour réserver la largeur du gras
    // et éviter que la pill change de taille quand un niveau est sélectionné.
    row.innerHTML =
      `<span class="level-dot" style="background:${lvl.color}"></span>` +
      `<span class="level-label">` +
        `<span class="label-visible">${lvl.label}</span>` +
        `<span class="ghost-bold" aria-hidden="true">${lvl.label}</span>` +
      `</span>` +
      `<span class="level-pts">` +
        `<span class="pts-visible">${lvl.pts}</span>` +
        `<span class="ghost-bold" aria-hidden="true">${lvl.pts}</span>` +
      `</span>`;
    pill.appendChild(row);
  });
  widget.appendChild(pill);
  if (lvlState > 0) update(true);

  function update(skipScore = false) {
    widget._state = lvlState;
    pill.querySelectorAll('.level-legend-row').forEach((row, i) => {
      const selected = lvlState === i + 1;
      // gras sur le niveau sélectionné uniquement
      row.querySelectorAll('.label-visible, .pts-visible').forEach(node => {
        node.style.fontWeight = selected ? '700' : '400';
      });
      // mêmes gris que le widget colonnes : défaut / sélectionné / non sélectionné
      const labelColor = lvlState === 0 ? '#6b7280' : selected ? '#374151' : '#9ca3af';
      row.querySelectorAll('.level-label').forEach(node => node.style.color = labelColor);
    });
    if (lvlState === 0) {
      widget._currentPts = 0;
      pill.style.background  = '#f3f4f6';
      pill.style.borderColor = '#d1d5db';
      titleEl.style.color    = '#6b7280';
      pill.querySelectorAll('.level-pts').forEach(node => node.style.color = '');
    } else {
      const lvl = levels[lvlState - 1];
      widget._currentPts = lvl.pts;
      pill.style.background  = lvl.color + '22';
      pill.style.borderColor = lvl.color;
      titleEl.style.color    = lvl.color;
      pill.querySelectorAll('.level-pts').forEach(node => node.style.color = '#111827');
      pill.querySelectorAll('.level-dot').forEach((dot, i) => dot.style.opacity = lvlState === i + 1 ? '1' : '0.5');
    }
    if (!skipScore) updateItemScore(itemId, itemPts);
  }
}
