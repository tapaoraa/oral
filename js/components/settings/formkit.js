// Petits constructeurs d'UI pour les formulaires de réglages.
// Dimensionnés pour le tactile (cibles ≥ 36 px).

import { el, svgIcon } from '../../core/dom.js';

export function mkGroup(label) {
  return el('div', {},
    el('p', { className: 'form-group-label', textContent: label }),
  );
}

export function mkConfigRow(extra = '') {
  return el('div', { className: `config-row ${extra}` });
}

export function mkTextInput(val, onChange, placeholder = '') {
  const inp = el('input', {
    type: 'text', value: val || '', placeholder,
    className: 'input config-text',
  });
  inp.addEventListener('input', () => onChange(inp.value));
  return inp;
}

export function mkNumInput(val, onChange, step = 1) {
  const inp = el('input', {
    type: 'number', value: val ?? '', step, min: 0,
    className: 'input config-num',
  });
  inp.addEventListener('change', () => onChange(Number(inp.value)));
  return inp;
}

export function mkInlineInput(value, isBold, onChange) {
  const inp = el('input', {
    type: 'text', value,
    className: 'input config-text' + (isBold ? ' bold' : ''),
  });
  inp.addEventListener('change', () => onChange(inp.value));
  return inp;
}

export function mkDelBtn(onClick) {
  const btn = el('button', { type: 'button', className: 'tool-btn tool-del', title: 'Supprimer' });
  btn.innerHTML = svgIcon('trash', 18, 1.8);
  btn.addEventListener('click', onClick);
  return btn;
}

export function mkEditBtn(onClick) {
  const btn = el('button', { type: 'button', className: 'tool-btn tool-edit', title: 'Modifier' });
  btn.innerHTML = svgIcon('pencil', 18);
  btn.addEventListener('click', onClick);
  return btn;
}

export function mkAddBtn(label, onClick) {
  return el('button', { type: 'button', className: 'btn-add', textContent: label, onclick: onClick });
}

export function mkColorDot(color, onChange) {
  const wrap = el('div', { className: 'color-dot', style: `background:${color || '#6b7280'};` });
  const inp = el('input', { type: 'color', value: color || '#6b7280' });
  inp.addEventListener('input', () => { onChange(inp.value); wrap.style.background = inp.value; });
  wrap.appendChild(inp);
  return wrap;
}

// En-tête de colonnes aligné sur les largeurs des lignes de config
// (pastille couleur 28 / label flexible / valeur 64 / flèches 64 / corbeille 36).
export function mkConfigHdr(hasDot, valueLabel, extra = '') {
  const hdr = el('div', { className: `config-hdr ${extra}` });
  hdr.innerHTML = (hasDot ? '<span class="w-dot">C</span>' : '')
    + '<span class="w-label">Label</span>'
    + `<span class="w-value">${valueLabel}</span>`
    + '<span class="w-move"></span>'
    + '<span class="w-del"></span>';
  return hdr;
}

// ── Réordonnancement ────────────────────────────────────────
function moveInArray(arr, i, dir) {
  const j = dir === 'up' ? i - 1 : i + 1;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function mkArrow(dir, disabled, onClick) {
  const btn = el('button', {
    type: 'button',
    className: 'arrow-btn' + (disabled ? ' disabled' : ''),
    textContent: dir === 'up' ? '↑' : '↓',
    disabled,
  });
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

export function mkMoveBtns(arr, i, onReorder) {
  return el('div', { className: 'move-btns' },
    mkArrow('up',   i === 0,              () => { moveInArray(arr, i, 'up');   onReorder(); }),
    mkArrow('down', i === arr.length - 1, () => { moveInArray(arr, i, 'down'); onReorder(); }),
  );
}
