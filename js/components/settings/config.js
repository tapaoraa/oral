// Onglet Config : édition de la grille (catégories, items, modalités)
// + chargement des grilles préenregistrées CG / DG + export/import de la grille seule.

import { $, el, setFlex, setVisible } from '../../core/dom.js';
import { emit } from '../../core/bus.js';
import { state, saveGrille, mkItemId, MODALITIES, setPillMode } from '../../core/store.js';
import { GRILLE_DATA_CG } from '../../data/grille-cg.js';
import { GRILLE_DATA_DG } from '../../data/grille-dg.js';
import {
  mkGroup, mkConfigRow, mkConfigHdr, mkTextInput, mkNumInput, mkInlineInput,
  mkDelBtn, mkEditBtn, mkAddBtn, mkColorDot, mkMoveBtns,
} from './formkit.js';

let _formCi = null, _formIi = null, _tempItem = null;

// ── Navigation interne du modal (liste ↔ formulaire item) ───
export function showCatView() {
  setFlex('view-cats', true);
  setFlex('view-item-form', false);
  setVisible('modal-addcat-row', true);
  setVisible('grille-actions', true);
}

function showItemForm(ci, ii) {
  _formCi = ci;
  if (ii === null) {
    state.gradeData[ci].items.push({ id: mkItemId(), name: '', pts: 10, modality: null, config: {} });
    _formIi = state.gradeData[ci].items.length - 1;
  } else {
    _formIi = ii;
  }
  _tempItem = state.gradeData[_formCi].items[_formIi];

  setFlex('view-cats', false);
  setFlex('view-item-form', true);
  setVisible('modal-addcat-row', false);
  setVisible('grille-actions', false);

  $('form-title').textContent = 'Retour';
  renderItemForm();
}

// ── Formulaire item ─────────────────────────────────────────
function renderItemForm() {
  saveGrille();
  const c = $('form-content');
  c.innerHTML = '';

  // Nom + points
  const infoGroup = mkGroup('Item');
  const nameInp = mkTextInput(_tempItem.name, v => _tempItem.name = v, "Nom de l'item");
  const ptsInp  = mkNumInput(_tempItem.pts ?? 10, v => _tempItem.pts = v);
  infoGroup.appendChild(el('div', { className: 'form-row' },
    nameInp,
    el('span', { className: 'form-inline-label', textContent: 'Points :' }),
    ptsInp,
  ));
  c.appendChild(infoGroup);

  // Modalité
  const modGroup = mkGroup("Modalité d'évaluation");
  const modBtns = el('div', { className: 'modality-btns' });
  Object.entries(MODALITIES).forEach(([key, mod]) => {
    const isActive = _tempItem.modality === key;
    const btn = el('button', {
      type: 'button',
      textContent: mod.label,
      className: 'modality-btn',
      style: isActive
        ? `border-color:${mod.color};background:${mod.bg};color:${mod.color};`
        : '',
    });
    btn.addEventListener('click', () => {
      _tempItem.modality = (_tempItem.modality === key) ? null : key;
      if (!_tempItem.config) _tempItem.config = {};
      renderItemForm();
    });
    modBtns.appendChild(btn);
  });
  modGroup.appendChild(modBtns);
  c.appendChild(modGroup);

  // Config spécifique à la modalité
  if (_tempItem.modality) {
    const cfgGroup = mkGroup('Configuration');
    renderModalityConfig(cfgGroup, _tempItem);
    c.appendChild(cfgGroup);
  }
}

function renderModalityConfig(container, item) {
  if (!item.config) item.config = {};
  const mod = item.modality;
  if (mod === 'check') {
    if (!item.config.pills) item.config.pills = [];
    renderCheckConfig(container, item.config);
  } else if (mod === 'level') {
    if (!item.config.groups) item.config.groups = [];
    renderLevelConfig(container, item.config);
  } else if (mod === 'columns') {
    if (!item.config.levels) item.config.levels = [];
    if (!item.config.pas) item.config.pas = 1;
    renderColumnsConfig(container, item.config);
  }
}

function renderCheckConfig(container, cfg) {
  container.appendChild(mkConfigHdr(false, 'Pts', 'mb-sm'));
  cfg.pills.forEach((pill, i) => {
    const row = mkConfigRow();
    row.appendChild(mkTextInput(pill.label, v => cfg.pills[i].label = v));
    row.appendChild(mkNumInput(pill.pts, v => cfg.pills[i].pts = v));
    row.appendChild(mkMoveBtns(cfg.pills, i, renderItemForm));
    row.appendChild(mkDelBtn(() => { cfg.pills.splice(i, 1); renderItemForm(); }));
    container.appendChild(row);
  });
  container.appendChild(mkAddBtn('+ Pill', () => { cfg.pills.push({ label: '', pts: 1 }); renderItemForm(); }));
}

function renderLevelConfig(container, cfg) {
  cfg.groups.forEach((grp, gi) => {
    const grpBox = el('div', { className: 'group-box' });

    const grpHdr = el('div', { className: 'group-box-hdr' });
    grpHdr.appendChild(mkInlineInput(grp.title, true, v => cfg.groups[gi].title = v));
    grpHdr.appendChild(mkMoveBtns(cfg.groups, gi, renderItemForm));
    grpHdr.appendChild(mkDelBtn(() => { cfg.groups.splice(gi, 1); renderItemForm(); }));
    grpBox.appendChild(grpHdr);

    grpBox.appendChild(mkConfigHdr(true, 'Pts', 'in-box'));
    grp.levels.forEach((lvl, li) => {
      const row = mkConfigRow('in-box');
      row.appendChild(mkColorDot(lvl.color, v => cfg.groups[gi].levels[li].color = v));
      row.appendChild(mkTextInput(lvl.label, v => cfg.groups[gi].levels[li].label = v));
      row.appendChild(mkNumInput(lvl.pts, v => cfg.groups[gi].levels[li].pts = v));
      row.appendChild(mkMoveBtns(grp.levels, li, renderItemForm));
      row.appendChild(mkDelBtn(() => { cfg.groups[gi].levels.splice(li, 1); renderItemForm(); }));
      grpBox.appendChild(row);
    });
    const addNivBtn = mkAddBtn('+ Niveau', () => {
      cfg.groups[gi].levels.push({ label: '', pts: 0, color: '#6b7280' });
      renderItemForm();
    });
    addNivBtn.classList.add('in-box-add');
    grpBox.appendChild(addNivBtn);
    container.appendChild(grpBox);
  });
  container.appendChild(mkAddBtn('+ Groupe', () => { cfg.groups.push({ title: '', levels: [] }); renderItemForm(); }));
}

function renderColumnsConfig(container, cfg) {
  const pasInput = mkNumInput(cfg.pas, v => cfg.pas = v, 0.5);
  pasInput.style.width = '80px';
  container.appendChild(el('div', { className: 'form-row mb-sm' },
    el('span', { className: 'form-inline-label', textContent: 'Pas :' }),
    pasInput,
  ));

  container.appendChild(mkConfigHdr(true, 'Max', 'mb-sm'));
  cfg.levels.forEach((lvl, li) => {
    const row = mkConfigRow();
    row.appendChild(mkColorDot(lvl.color, v => cfg.levels[li].color = v));

    const ta = el('textarea', { value: lvl.label, rows: 2, placeholder: 'Label…', className: 'config-textarea' });
    const autoResize = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    ta.addEventListener('input', () => { cfg.levels[li].label = ta.value; autoResize(); });
    setTimeout(autoResize, 0);
    row.appendChild(ta);

    const maxInput = mkNumInput(lvl.max, v => {
      const rounded = Math.round(v / cfg.pas) * cfg.pas;
      cfg.levels[li].max = rounded;
      maxInput.value = rounded;
    }, cfg.pas);
    row.appendChild(maxInput);
    row.appendChild(mkMoveBtns(cfg.levels, li, renderItemForm));
    row.appendChild(mkDelBtn(() => { cfg.levels.splice(li, 1); renderItemForm(); }));
    container.appendChild(row);
  });
  container.appendChild(mkAddBtn('+ Niveau', () => {
    const prevMax = cfg.levels.length ? cfg.levels[cfg.levels.length - 1].max : 0;
    cfg.levels.push({ label: '', max: prevMax + cfg.pas, color: '#6b7280' });
    renderItemForm();
  }));
}

// ── Liste des catégories ────────────────────────────────────
export function renderSettings() {
  const container = $('settings-cats');
  container.innerHTML = '';

  state.gradeData.forEach((cat, ci) => {
    const card = el('div', { className: 'cat-card' });

    const header = el('div', { className: 'cat-card-hdr' });
    header.appendChild(mkInlineInput(cat.name, true, v => { state.gradeData[ci].name = v; saveGrille(); }));

    const catTotal = cat.items.reduce((s, it) => s + (it.pts ?? 10), 0);
    header.appendChild(el('span', { className: 'cat-card-pts', textContent: catTotal + ' pts' }));
    header.appendChild(mkMoveBtns(state.gradeData, ci, () => { saveGrille(); renderSettings(); }));

    const hdrActions = el('div', { className: 'cat-card-actions' });
    hdrActions.appendChild(el('button', {
      type: 'button', className: 'link-btn link-add', textContent: 'Ajouter',
      onclick: () => {
        state.gradeData[ci].items.push({ id: mkItemId(), name: 'Nouvel item', modality: null, config: {}, pts: 10 });
        saveGrille(); renderSettings();
      },
    }));
    hdrActions.appendChild(el('button', {
      type: 'button', className: 'link-btn link-del', textContent: 'Supprimer',
      onclick: () => { state.gradeData.splice(ci, 1); saveGrille(); renderSettings(); },
    }));
    header.appendChild(hdrActions);
    card.appendChild(header);

    const itemsList = el('div', { className: 'cat-card-items' });
    cat.items.forEach((item, ii) => {
      const row = el('div', { className: 'item-row' });
      row.appendChild(mkInlineInput(item.name, false, v => { state.gradeData[ci].items[ii].name = v; saveGrille(); }));
      row.appendChild(mkModalityPill(item.modality));

      const actions = el('div', { className: 'item-row-actions' });
      actions.appendChild(mkMoveBtns(cat.items, ii, () => { saveGrille(); renderSettings(); }));
      actions.appendChild(mkEditBtn(() => showItemForm(ci, ii)));
      actions.appendChild(mkDelBtn(() => { state.gradeData[ci].items.splice(ii, 1); saveGrille(); renderSettings(); }));
      row.appendChild(actions);
      itemsList.appendChild(row);
    });
    card.appendChild(itemsList);
    container.appendChild(card);
  });
}

function mkModalityPill(modality) {
  if (!modality) {
    return el('span', { className: 'modality-tag missing', textContent: '?' });
  }
  const mod = MODALITIES[modality];
  return el('span', {
    className: 'modality-tag',
    textContent: mod.label,
    style: `background:${mod.bg};color:${mod.color};`,
  });
}

// ── Chargement grilles préenregistrées / export-import ──────
function loadGrillePreset(data, label) {
  if (confirm(`Charger la grille "${label}" ? Les données actuelles seront remplacées.`)) {
    state.gradeData = JSON.parse(JSON.stringify(data));
    saveGrille();
    renderSettings();
    emit('render:grille');
  }
}

function updatePillModeToggleUI() {
  const simple = $('pill-mode-label-simple');
  const detail = $('pill-mode-label-detail');
  simple.classList.toggle('on', state.pillMode === 'simple');
  detail.classList.toggle('on', state.pillMode !== 'simple');
}

export function initConfigTab() {
  $('btn-form-back').addEventListener('click', () => {
    saveGrille();
    showCatView();
    renderSettings();
  });

  $('btn-add-cat').addEventListener('click', () => {
    const input = $('input-new-cat');
    const val = input.value.trim();
    if (val) {
      state.gradeData.push({ id: 'cat-' + Date.now(), name: val, items: [] });
      input.value = '';
      saveGrille(); renderSettings();
    }
  });
  $('input-new-cat').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('btn-add-cat').click();
  });

  $('btn-load-cg').addEventListener('click', () => loadGrillePreset(GRILLE_DATA_CG, 'CG'));
  $('btn-load-dg').addEventListener('click', () => loadGrillePreset(GRILLE_DATA_DG, 'DG'));

  $('btn-export-grille').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.gradeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'grille.json' });
    a.click();
    URL.revokeObjectURL(url);
  });

  $('btn-import-grille').addEventListener('click', () => {
    const fileInput = el('input', { type: 'file', accept: '.json,application/json' });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) throw new Error();
          state.gradeData = data;
          saveGrille(); renderSettings();
          emit('render:grille');
        } catch (_) { alert('Fichier JSON invalide.'); }
      };
      reader.readAsText(file);
    });
    fileInput.click();
  });

  $('toggle-pill-mode').addEventListener('click', () => {
    setPillMode(state.pillMode === 'simple' ? 'detail' : 'simple');
    updatePillModeToggleUI();
    emit('render:grille');
  });
  updatePillModeToggleUI();
}
