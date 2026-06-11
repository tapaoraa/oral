// Sidebar liste des élèves : sélection + statut (en attente / terminé / absent).

import { $, el } from '../core/dom.js';
import { emit, on } from '../core/bus.js';
import { state, saveEleves, STATUS_CYCLE, STATUS_COLOR, STATUS_LABEL } from '../core/store.js';
import { updateBannerStatusDot } from './banner.js';

export function renderSidebarList() {
  const ul = $('sidebar-eleves-list');
  ul.innerHTML = '';
  if (!state.elevesList.length) {
    ul.appendChild(el('li', { className: 'sidebar-empty', textContent: 'Aucun élève' }));
    return;
  }
  state.elevesList.forEach((eleve, i) => {
    const isSelected = state.selectedEleveIdx === i;
    const li = el('li', { className: 'sidebar-row' + (isSelected ? ' selected' : '') });

    const name = el('span', { className: 'sidebar-name' });
    name.innerHTML = `<strong>${eleve.nom}</strong>${eleve.prenom ? ' ' + eleve.prenom : ''}`;

    const dot = el('button', {
      type: 'button',
      className: 'sidebar-status-dot',
      title: STATUS_LABEL[eleve.status || 'none'],
      style: `background:${STATUS_COLOR[eleve.status || 'none']};`,
    });
    dot.addEventListener('click', () => {
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(eleve.status || 'none') + 1) % STATUS_CYCLE.length];
      eleve.status = next;
      dot.style.background = STATUS_COLOR[next];
      dot.title = STATUS_LABEL[next];
      saveEleves();
      updateBannerStatusDot();
    });

    li.addEventListener('click', e => { if (e.target !== dot) emit('eleve:select', i, false); });
    li.appendChild(name);
    li.appendChild(dot);
    ul.appendChild(li);
  });
}

export function openSidebar() {
  renderSidebarList();
  $('sidebar-eleves').classList.add('open');
  $('sidebar-overlay').classList.remove('hidden');
}

export function closeSidebar() {
  $('sidebar-eleves').classList.remove('open');
  $('sidebar-overlay').classList.add('hidden');
}

export function initSidebar() {
  $('btn-eleves').addEventListener('click', openSidebar);
  $('btn-close-sidebar').addEventListener('click', closeSidebar);
  $('sidebar-overlay').addEventListener('click', closeSidebar);
  on('render:sidebar', renderSidebarList);
}
