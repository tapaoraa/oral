// Onglet Élèves : import par collage de liste + édition/suppression.

import { $, el, svgIcon } from '../../core/dom.js';
import { emit } from '../../core/bus.js';
import { state, saveEleves, parseEleves, parseEleveLine } from '../../core/store.js';

let editingEleveIdx = null;

export function renderElevesSettingsList(focusIdx = null) {
  const ul = $('eleves-settings-list');
  const count = $('eleves-count');
  ul.innerHTML = '';
  count.textContent = state.elevesList.length
    ? `${state.elevesList.length} élève(s) dans cette classe`
    : '';

  state.elevesList.forEach((eleve, i) => {
    const li = el('li', { className: 'eleve-row' });

    if (editingEleveIdx === i) {
      // Mode édition
      const input = el('input', {
        type: 'text', value: eleve.display, placeholder: 'NOM Prénom',
        className: 'input eleve-edit-input',
      });

      const save = el('button', { type: 'button', className: 'tool-btn tool-ok', title: 'Valider' });
      save.innerHTML = svgIcon('check', 20, 2.5);
      const cancel = el('button', { type: 'button', className: 'tool-btn', title: 'Annuler' });
      cancel.innerHTML = svgIcon('x', 20, 2.5);

      const commit = () => {
        const raw = input.value.trim();
        if (raw) {
          const parsed = parseEleveLine(raw);
          eleve.nom = parsed.nom;
          eleve.prenom = parsed.prenom;
          eleve.display = parsed.display;
        } else if (eleve.display === '') {
          state.elevesList.splice(i, 1);
        }
        editingEleveIdx = null;
        saveEleves();
        renderElevesSettingsList();
        emit('render:sidebar');
        emit('render:banner');
      };

      save.addEventListener('click', commit);
      cancel.addEventListener('click', () => {
        if (eleve.display === '') state.elevesList.splice(i, 1);
        editingEleveIdx = null;
        renderElevesSettingsList();
        emit('render:sidebar');
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel.click();
      });

      li.appendChild(input);
      li.appendChild(save);
      li.appendChild(cancel);
      if (focusIdx === i) setTimeout(() => input.focus(), 30);

    } else {
      // Mode affichage
      li.appendChild(el('span', { className: 'eleve-name', textContent: eleve.display || '—' }));

      const edit = el('button', { type: 'button', className: 'tool-btn tool-edit', title: 'Modifier' });
      edit.innerHTML = svgIcon('pencil', 18);
      edit.addEventListener('click', () => { editingEleveIdx = i; renderElevesSettingsList(i); });

      const del = el('button', { type: 'button', className: 'tool-btn tool-del', title: 'Supprimer' });
      del.innerHTML = svgIcon('trash', 18);
      del.addEventListener('click', () => {
        state.elevesList.splice(i, 1);
        if (!state.elevesList.length) state.selectedEleveIdx = null;
        else if (state.selectedEleveIdx >= state.elevesList.length) state.selectedEleveIdx = state.elevesList.length - 1;
        editingEleveIdx = null;
        saveEleves();
        renderElevesSettingsList();
        emit('render:sidebar');
        emit('render:banner');
      });

      li.appendChild(edit);
      li.appendChild(del);
    }
    ul.appendChild(li);
  });
}

export function initElevesTab() {
  $('btn-import-eleves').addEventListener('click', () => {
    const nouveaux = parseEleves($('textarea-eleves').value);
    if (!nouveaux.length) return;
    state.elevesList.push(...nouveaux);
    $('textarea-eleves').value = '';
    if (state.selectedEleveIdx === null) state.selectedEleveIdx = 0;
    saveEleves();
    renderElevesSettingsList();
    emit('render:sidebar');
    emit('render:banner');
  });
}
