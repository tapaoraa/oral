// Export PDF des grilles notées — élève actif (1 page) ou tous (1 page/élève).
// Repose sur html2canvas (rendu fidèle du DOM) + jsPDF (mise en page A4).

import { $, el } from '../core/dom.js';
import { state, selectedEleve } from '../core/store.js';
import { renderGrille } from './grille.js';

// Nettoie une chaîne pour en faire un nom de fichier sûr (accents → ASCII).
function safe(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-zA-Z0-9]+/g, '_')                   // tout le reste → _
    .replace(/^_+|_+$/g, '');
}

function buildFilename(eleve) {
  const nom = safe(eleve.nom);
  const prenom = safe(eleve.prenom);
  return `Eval_${nom}${prenom ? '_' + prenom : ''}.pdf`;
}

// Construit un conteneur hors-écran reproduisant le visuel de la grille notée.
function buildPrintRoot(eleve) {
  const root = el('div', { className: 'print-root' });

  const header = el('div', { className: 'print-header' });
  const title = el('div', { className: 'print-title' });
  title.innerHTML = `<strong>${eleve.nom}</strong>${eleve.prenom ? ' ' + eleve.prenom : ''}`;
  const total = $('total-bar-score')?.textContent ?? '—';
  const max = $('total-bar-max')?.textContent ?? '';
  const meta = el('div', { className: 'print-meta', textContent: `Total : ${total} ${max}`.trim() });
  header.appendChild(title);
  header.appendChild(meta);
  root.appendChild(header);

  if (eleve.conseils && eleve.conseils.trim()) {
    // Une puce par ligne saisie (les retours à la ligne sont conservés).
    const lines = eleve.conseils.split('\n').map(s => s.trim()).filter(Boolean);
    const block = el('div', { className: 'print-conseils' },
      el('span', { className: 'print-conseils-label', textContent: 'Conseils :' }),
    );
    const list = el('ul', { className: 'print-conseils-list' });
    lines.forEach(line => list.appendChild(el('li', { textContent: line })));
    block.appendChild(list);
    root.appendChild(block);
  }

  // Clone de la grille telle qu'affichée (couleurs, niveaux choisis, pills…).
  const clone = $('grille-sections').cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.add('print-grille');
  root.appendChild(clone);

  return root;
}

// Élargit la colonne « Évaluation » pour afficher les "level" en entier.
// Doit être appelée après insertion dans le DOM (mesure de layout).
function fitEvalColumn(root) {
  const wraps = [...root.querySelectorAll('.level-wrap')];
  if (!wraps.length) return; // aucun "level" : on garde la largeur par défaut

  const PAD = 20;           // padding .widget-pad (10px de chaque côté)
  const SAFETY = 4;         // marge pour les arrondis sub-pixel
  const ROOT_PAD = 18 * 2;  // padding .print-root
  const PROBE = 4000;       // largeur provisoire pour mesurer sans contrainte
  const tables = [...root.querySelectorAll('.cat-table')];
  const tdEval = root.querySelector('.td-eval');
  if (!tdEval) return;

  // 1) On élargit d'abord les tableaux pour que les "level" (labels en flex:1)
  //    s'étalent à leur largeur naturelle (sinon la mesure est sous-évaluée).
  tables.forEach(t => { t.style.width = PROBE + 'px'; });

  // « Surcoût » mesuré (colonne Item + bordures du tableau) = tout ce que la
  //    colonne Évaluation ne reçoit pas. clientWidth = largeur de contenu réelle.
  const overhead = PROBE - tdEval.clientWidth;
  // Largeur naturelle du plus large "level" (cellule non contrainte ici).
  let maxWrap = 0;
  wraps.forEach(wrap => { maxWrap = Math.max(maxWrap, Math.ceil(wrap.getBoundingClientRect().width)); });

  // 2) Largeur définitive : surcoût + (besoin du level + padding du widget).
  const tableW = Math.max(800 - ROOT_PAD, overhead + maxWrap + PAD + SAFETY);
  tables.forEach(t => { t.style.width = tableW + 'px'; });
  root.style.width = (tableW + ROOT_PAD) + 'px';
}

// Capture le clone hors-écran en canvas haute résolution.
async function renderCanvas(root) {
  return window.html2canvas(root, {
    scale: 2,
    backgroundColor: '#ffffff',
    windowWidth: root.offsetWidth,
    useCORS: true,
  });
}

// Ajoute le canvas comme une page A4 : image centrée, tenant sur une page.
function addCanvasPage(pdf, canvas, newPage) {
  if (newPage) pdf.addPage();
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const ratio = canvas.width / canvas.height;
  let w = availW;
  let h = w / ratio;
  if (h > availH) { h = availH; w = h * ratio; }
  const x = (pageW - w) / 2;
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', x, margin, w, h);
}

// Rend la grille pour l'élève d'indice `idx` puis capture sa page.
async function captureEleve(idx) {
  state.selectedEleveIdx = idx;
  renderGrille(); // met aussi à jour la barre de total (lue par buildPrintRoot)
  const root = buildPrintRoot(state.elevesList[idx]);
  document.body.appendChild(root);
  fitEvalColumn(root);
  try {
    return await renderCanvas(root);
  } finally {
    root.remove();
  }
}

export async function printActiveEleve() {
  const eleve = selectedEleve();
  if (!eleve) { alert('Sélectionnez un élève avant d\'imprimer.'); return; }
  if (!window.html2canvas || !window.jspdf) { alert('Module PDF non chargé.'); return; }

  const btn = $('btn-print');
  btn?.classList.add('busy');
  try {
    const canvas = await captureEleve(state.selectedEleveIdx);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    addCanvasPage(pdf, canvas, false);
    pdf.save(buildFilename(eleve));
  } catch (err) {
    console.error(err);
    alert('La génération du PDF a échoué.');
  } finally {
    btn?.classList.remove('busy');
  }
}

// Enregistre tous les élèves dans un seul PDF : une page par élève.
export async function printAllEleves() {
  if (!state.elevesList.length) { alert('Aucun élève.'); return; }
  if (!window.html2canvas || !window.jspdf) { alert('Module PDF non chargé.'); return; }

  const btn = $('btn-export-all-pdf');
  btn?.classList.add('busy');
  const prevIdx = state.selectedEleveIdx;
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let i = 0; i < state.elevesList.length; i++) {
      const canvas = await captureEleve(i);
      addCanvasPage(pdf, canvas, i > 0);
    }
    pdf.save('Evaluations_oral.pdf');
  } catch (err) {
    console.error(err);
    alert('La génération du PDF a échoué.');
  } finally {
    // Restaure l'affichage de l'élève sélectionné avant l'export.
    state.selectedEleveIdx = prevIdx;
    renderGrille();
    btn?.classList.remove('busy');
  }
}

export function initPrint() {
  $('btn-print').addEventListener('click', printActiveEleve);
  $('btn-export-all-pdf')?.addEventListener('click', printAllEleves);
}
