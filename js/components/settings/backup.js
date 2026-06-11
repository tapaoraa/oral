// Onglet Sauvegarde : export/import JSON complet + export XLSX.

import { $, el } from '../../core/dom.js';
import { emit } from '../../core/bus.js';
import { state, saveGrille, saveEleves, computeItemScore } from '../../core/store.js';
import { renderSettings } from './config.js';
import { renderElevesSettingsList } from './eleves.js';

export function initBackupTab() {
  // ── JSON (grille + élèves + notes) ─────────────────────────
  $('btn-export-json').addEventListener('click', () => {
    const payload = { gradeData: state.gradeData, elevesList: state.elevesList };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'grille-orale.json' });
    a.click();
    URL.revokeObjectURL(url);
  });

  $('btn-import-json').addEventListener('click', () => {
    const fileInput = el('input', { type: 'file', accept: '.json,application/json' });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.gradeData && Array.isArray(data.gradeData)) {
            state.gradeData = data.gradeData;
            if (Array.isArray(data.elevesList)) {
              state.elevesList = data.elevesList;
              state.selectedEleveIdx = state.elevesList.length ? 0 : null;
            }
          } else if (Array.isArray(data)) {
            state.gradeData = data;
          } else throw new Error();
          saveGrille();
          saveEleves();
          renderSettings();
          renderElevesSettingsList();
          emit('render:grille');
          emit('render:sidebar');
          emit('render:banner');
        } catch (_) { alert('Fichier JSON invalide.'); }
      };
      reader.readAsText(file);
    });
    fileInput.click();
  });

  // ── XLSX : une ligne par élève, une colonne par item ───────
  $('btn-export-xlsx').addEventListener('click', () => {
    if (!state.elevesList.length) { alert('Aucun élève.'); return; }
    const XLSX = window.XLSX;
    if (!XLSX) { alert('Librairie XLSX non chargée.'); return; }

    const allItems = state.gradeData.flatMap(cat => cat.items);
    const totalMax = allItems.reduce((s, it) => s + (it.pts ?? 10), 0);
    const headers = ['NOM', 'Prénom', ...allItems.map(it => it.name), 'TOTAL'];
    const maxRow  = ['', '', ...allItems.map(it => `/ ${it.pts ?? 10}`), `/ ${totalMax}`];
    const rows = state.elevesList.map(eleve => {
      const scores = eleve.scores || {};
      const itemScores = allItems.map(it => computeItemScore(it, scores));
      const total = itemScores.reduce((a, b) => a + b, 0);
      return [eleve.nom, eleve.prenom || '', ...itemScores, total];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, maxRow, ...rows]);

    // Lignes 1 et 2 en gras
    const boldStyle = { font: { bold: true } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      [0, 1].forEach(R => {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = boldStyle;
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    XLSX.writeFile(wb, 'notes-oral.xlsx');
  });
}
