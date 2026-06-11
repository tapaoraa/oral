// État global de l'application + persistance localStorage.
// Les clés localStorage (gradeData, elevesList, pillMode) sont conservées
// telles quelles pour rester compatibles avec les données existantes.

import { emit } from './bus.js';

export const MODALITIES = {
  check:   { label: 'Check',  color: '#16a34a', bg: '#dcfce7' },
  level:   { label: 'Level',  color: '#7c3aed', bg: '#ede9fe' },
  columns: { label: 'Column', color: '#ea580c', bg: '#ffedd5' },
};

export const CAT_COLOR_PALETTE = ['#1e3a5f', '#3b1f5e', '#1f4e3d', '#7c3a00', '#1a4a4a', '#4a1a3a'];

export const STATUS_CYCLE = ['none', 'done', 'absent'];
export const STATUS_COLOR = { none: '#d1d5db', done: '#16a34a', absent: '#dc2626' };
export const STATUS_LABEL = { none: 'En attente', done: 'Terminé', absent: 'Absent' };

export const state = {
  gradeData: [],
  elevesList: [],
  selectedEleveIdx: null,
  pillMode: 'detail',
};

export function mkItemId() {
  return 'item_' + Math.random().toString(36).slice(2, 9);
}

// ── Persistance grille ──────────────────────────────────────
export function saveGrille() {
  try { localStorage.setItem('gradeData', JSON.stringify(state.gradeData)); } catch (_) {}
}

function loadGrilleFromStorage() {
  try {
    const saved = localStorage.getItem('gradeData');
    if (saved) {
      const data = JSON.parse(saved);
      data.forEach(cat => cat.items.forEach(item => {
        if (!item.id) item.id = mkItemId();
      }));
      return data;
    }
  } catch (_) {}
  return null;
}

// ── Persistance élèves ──────────────────────────────────────
export function saveEleves() {
  try { localStorage.setItem('elevesList', JSON.stringify(state.elevesList)); } catch (_) {}
}

function loadElevesFromStorage() {
  try {
    const saved = localStorage.getItem('elevesList');
    if (saved) {
      const data = JSON.parse(saved);
      // Migration : anciens enregistrements = tableau de chaînes
      if (data.length && typeof data[0] === 'string') {
        return data.map(parseEleveLine);
      }
      // Migration : statut manquant
      return data.map(e => ({ status: 'none', ...e }));
    }
  } catch (_) {}
  return [];
}

// ── Parsing élèves ──────────────────────────────────────────
export function parseEleveLine(line) {
  const space = line.indexOf(' ');
  if (space === -1) {
    const nom = line.toUpperCase();
    return { nom, prenom: '', display: nom, status: 'none' };
  }
  const nom = line.slice(0, space).toUpperCase();
  const prenom = line.slice(space + 1).trim();
  return { nom, prenom, display: `${nom} ${prenom}`, status: 'none' };
}

export function parseEleves(raw) {
  return raw.split('\n').map(s => s.trim()).filter(Boolean).map(parseEleveLine);
}

// ── Élève sélectionné / scores ──────────────────────────────
export function selectedEleve() {
  return state.selectedEleveIdx === null ? null : state.elevesList[state.selectedEleveIdx] || null;
}

export function getStudentScores() {
  const eleve = selectedEleve();
  return eleve ? (eleve.scores || {}) : {};
}

export function saveItemScore(itemId, data) {
  const eleve = selectedEleve();
  if (!eleve) return;
  if (!eleve.scores) eleve.scores = {};
  eleve.scores[itemId] = data;
  saveEleves();
  emit('grille:changed'); // point central : déclenche la mise à jour du témoin de complétude
}

// ── Complétude (témoin "grille remplie") ────────────────────
// Un item est "notable" si sa modalité a une configuration exploitable.
export function isItemGradeable(item) {
  if (item.modality === 'check')   return !!item.config?.pills?.length;
  if (item.modality === 'level')   return !!item.config?.groups?.length;
  if (item.modality === 'columns') return !!item.config?.levels?.length;
  return false;
}

// Un item est "complet" quand chacun de ses blocs a été renseigné :
//   check   → chaque pastille décidée (validée ou rejetée, plus aucune neutre)
//   level   → chaque groupe a un niveau sélectionné
//   columns → un nombre de points a été coché
export function isItemComplete(item, scores) {
  const s = scores?.[item.id];
  if (item.modality === 'check') {
    const pills = item.config?.pills || [];
    if (!pills.length) return false;
    const states = s?.states || [];
    return pills.every((_, i) => states[i] === 'active' || states[i] === 'rejected');
  }
  if (item.modality === 'level') {
    const groups = item.config?.groups || [];
    if (!groups.length) return false;
    const gs = s?.groupStates || [];
    return groups.every((_, i) => (gs[i] ?? 0) > 0);
  }
  if (item.modality === 'columns') {
    if (!item.config?.levels?.length) return false;
    return s?.ptBoxChosen === true;
  }
  return false;
}

// La grille est complète si elle a au moins un item notable et qu'ils le sont tous.
export function isGrilleComplete(scores) {
  const gradeable = state.gradeData.flatMap(c => c.items).filter(isItemGradeable);
  if (!gradeable.length) return false;
  return gradeable.every(it => isItemComplete(it, scores));
}

// Score d'un item à partir des données enregistrées (export XLSX)
export function computeItemScore(item, scores) {
  const s = scores?.[item.id];
  const itemPts = item.pts ?? 10;
  if (!s) return 0;
  if (s.type === 'check') {
    return (item.config?.pills || []).reduce((sum, p, i) => sum + (s.states?.[i] === 'active' ? p.pts : 0), 0);
  }
  if (s.type === 'level') {
    const groups = item.config?.groups || [];
    const sumCurrent = groups.reduce((sum, grp, gi) => {
      const st = s.groupStates?.[gi] ?? 0;
      return sum + (st > 0 ? (grp.levels[st - 1]?.pts ?? 0) : 0);
    }, 0);
    const sumMax = groups.reduce((sum, grp) => sum + (grp.levels[grp.levels.length - 1]?.pts ?? 0), 0);
    return sumMax > 0 ? Math.round((sumCurrent / sumMax) * itemPts) : 0;
  }
  if (s.type === 'columns') return s.score ?? 0;
  return 0;
}

// ── Mode d'affichage des pills ──────────────────────────────
export function setPillMode(mode) {
  state.pillMode = mode;
  try { localStorage.setItem('pillMode', mode); } catch (_) {}
}

// ── Initialisation ──────────────────────────────────────────
export function initState() {
  state.pillMode = localStorage.getItem('pillMode') || 'detail';
  if (!localStorage.getItem('pillMode')) setPillMode('detail');
  state.gradeData = loadGrilleFromStorage() || [];
  state.elevesList = loadElevesFromStorage();
  state.selectedEleveIdx = state.elevesList.length ? 0 : null;
}
